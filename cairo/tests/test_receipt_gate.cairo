use starknet::ContractAddress;
use snforge_std::{
    ContractClassTrait, DeclareResultTrait, declare, start_cheat_block_timestamp,
    start_cheat_caller_address,
};
use snforge_std::signature::{KeyPairTrait, SignerTrait};
use snforge_std::signature::stark_curve::{
    StarkCurveKeyPair, StarkCurveKeyPairImpl, StarkCurveSignerImpl,
};
use core::poseidon::poseidon_hash_span;
use ghostmode_receipt_gate::{
    IReceiptGateDispatcher, IReceiptGateDispatcherTrait, IReceiptGateSafeDispatcher,
    IReceiptGateSafeDispatcherTrait,
};

const POOL: felt252 = 0x123;
const OUTSIDER: felt252 = 0x999;
const SELLER_SECRET: felt252 = 0x456;

fn address(value: felt252) -> ContractAddress {
    value.try_into().unwrap()
}

fn deploy_gate() -> (ContractAddress, IReceiptGateDispatcher, IReceiptGateSafeDispatcher) {
    let contract = declare("ReceiptGate").unwrap().contract_class();
    let key_pair: StarkCurveKeyPair = KeyPairTrait::from_secret_key(SELLER_SECRET);
    let calldata = array![POOL, key_pair.public_key];
    let (contract_address, _) = contract.deploy(@calldata).unwrap();
    (
        contract_address,
        IReceiptGateDispatcher { contract_address },
        IReceiptGateSafeDispatcher { contract_address },
    )
}

fn authorization(
    contract_address: ContractAddress, quote_id: felt252, commitment: felt252, valid_until: u64,
) -> (felt252, felt252) {
    let key_pair: StarkCurveKeyPair = KeyPairTrait::from_secret_key(SELLER_SECRET);
    let message_hash = poseidon_hash_span(
        array![contract_address.into(), quote_id, commitment, valid_until.into()].span(),
    );
    key_pair.sign(message_hash).unwrap()
}

#[test]
fn valid_request_is_consumed_once() {
    let (contract_address, dispatcher, _) = deploy_gate();
    start_cheat_caller_address(contract_address, address(POOL));
    start_cheat_block_timestamp(contract_address, 100);

    let (r, s) = authorization(contract_address, 0x11, 0x22, 101);
    let deposits = dispatcher.privacy_invoke(address(POOL), 0x11, 0x22, 101, r, s);
    assert(deposits.is_empty(), 'unexpected deposits');
    assert(dispatcher.is_consumed(0x11), 'request not consumed');
    assert(dispatcher.get_pool() == address(POOL), 'wrong pool');
}

#[test]
fn exact_expiry_timestamp_is_valid() {
    let (contract_address, dispatcher, _) = deploy_gate();
    start_cheat_caller_address(contract_address, address(POOL));
    start_cheat_block_timestamp(contract_address, 100);
    let (r, s) = authorization(contract_address, 0x11, 0x22, 100);
    dispatcher.privacy_invoke(address(POOL), 0x11, 0x22, 100, r, s);
    assert(dispatcher.is_consumed(0x11), 'edge expiry rejected');
}

#[test]
#[feature("safe_dispatcher")]
fn rejects_unauthorized_caller() {
    let (contract_address, _, safe) = deploy_gate();
    start_cheat_caller_address(contract_address, address(OUTSIDER));
    let (r, s) = authorization(contract_address, 0x11, 0x22, 100);
    match safe.privacy_invoke(address(POOL), 0x11, 0x22, 100, r, s) {
        Result::Ok(_) => panic!("unauthorized caller accepted"),
        Result::Err(data) => assert(*data.at(0) == 'BAD_POOL', 'wrong panic'),
    };
}

#[test]
#[feature("safe_dispatcher")]
fn rejects_pool_placeholder_substitution() {
    let (contract_address, _, safe) = deploy_gate();
    start_cheat_caller_address(contract_address, address(POOL));
    let (r, s) = authorization(contract_address, 0x11, 0x22, 100);
    match safe.privacy_invoke(address(OUTSIDER), 0x11, 0x22, 100, r, s) {
        Result::Ok(_) => panic!("bad pool accepted"),
        Result::Err(data) => assert(*data.at(0) == 'BAD_POOL', 'wrong panic'),
    };
}

#[test]
#[feature("safe_dispatcher")]
fn rejects_expired_request() {
    let (contract_address, _, safe) = deploy_gate();
    start_cheat_caller_address(contract_address, address(POOL));
    start_cheat_block_timestamp(contract_address, 101);
    let (r, s) = authorization(contract_address, 0x11, 0x22, 100);
    match safe.privacy_invoke(address(POOL), 0x11, 0x22, 100, r, s) {
        Result::Ok(_) => panic!("expired request accepted"),
        Result::Err(data) => assert(*data.at(0) == 'QUOTE_EXPIRED', 'wrong panic'),
    };
}

#[test]
#[feature("safe_dispatcher")]
fn rejects_replay_without_changing_consumed_state() {
    let (contract_address, dispatcher, safe) = deploy_gate();
    start_cheat_caller_address(contract_address, address(POOL));
    let (r, s) = authorization(contract_address, 0x11, 0x22, 100);
    dispatcher.privacy_invoke(address(POOL), 0x11, 0x22, 100, r, s);
    match safe.privacy_invoke(address(POOL), 0x11, 0x22, 100, r, s) {
        Result::Ok(_) => panic!("replay accepted"),
        Result::Err(data) => assert(*data.at(0) == 'QUOTE_REPLAY', 'wrong panic'),
    };
    assert(dispatcher.is_consumed(0x11), 'consumed state lost');
}

#[test]
#[feature("safe_dispatcher")]
fn rejects_malformed_identifiers() {
    let (contract_address, _, safe) = deploy_gate();
    start_cheat_caller_address(contract_address, address(POOL));
    let (zero_r, zero_s) = authorization(contract_address, 0, 0x22, 100);
    match safe.privacy_invoke(address(POOL), 0, 0x22, 100, zero_r, zero_s) {
        Result::Ok(_) => panic!("zero quote accepted"),
        Result::Err(data) => assert(*data.at(0) == 'ZERO_QUOTE', 'wrong quote panic'),
    };
    let (commit_r, commit_s) = authorization(contract_address, 0x11, 0, 100);
    match safe.privacy_invoke(address(POOL), 0x11, 0, 100, commit_r, commit_s) {
        Result::Ok(_) => panic!("zero commitment accepted"),
        Result::Err(data) => assert(*data.at(0) == 'ZERO_COMMITMENT', 'wrong commitment panic'),
    };
}

#[test]
fn independent_requests_do_not_collide() {
    let (contract_address, dispatcher, _) = deploy_gate();
    start_cheat_caller_address(contract_address, address(POOL));
    let (r1, s1) = authorization(contract_address, 0x11, 0x21, 100);
    let (r2, s2) = authorization(contract_address, 0x12, 0x22, 100);
    dispatcher.privacy_invoke(address(POOL), 0x11, 0x21, 100, r1, s1);
    dispatcher.privacy_invoke(address(POOL), 0x12, 0x22, 100, r2, s2);
    assert(dispatcher.is_consumed(0x11), 'first not consumed');
    assert(dispatcher.is_consumed(0x12), 'second not consumed');
}

#[test]
#[feature("safe_dispatcher")]
fn rejects_unauthorized_seller_signature_and_cross_request_substitution() {
    let (contract_address, _, safe) = deploy_gate();
    start_cheat_caller_address(contract_address, address(POOL));
    let (r, s) = authorization(contract_address, 0x11, 0x22, 100);
    match safe.privacy_invoke(address(POOL), 0x12, 0x22, 100, r, s) {
        Result::Ok(_) => panic!("substituted quote accepted"),
        Result::Err(data) => assert(*data.at(0) == 'BAD_SELLER_AUTH', 'wrong auth panic'),
    };
}
