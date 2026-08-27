use starknet::ContractAddress;

// The pool deserializes the helper return value as this exact positional type.
// ReceiptGate returns an empty span because the seller receives a normal encrypted
// note from the transfer action in the same private pool transaction.
#[derive(Serde, Copy, Drop, PartialEq, Debug)]
pub struct OpenNoteDeposit {
    pub note_id: felt252,
    pub token: ContractAddress,
    pub amount: u128,
}

#[starknet::interface]
pub trait IReceiptGate<TState> {
    fn privacy_invoke(
        ref self: TState,
        pool_address: ContractAddress,
        quote_id: felt252,
        resource_commitment: felt252,
        valid_until: u64,
        authorization_r: felt252,
        authorization_s: felt252,
    ) -> Span<OpenNoteDeposit>;
    fn is_consumed(self: @TState, quote_id: felt252) -> bool;
    fn get_pool(self: @TState) -> ContractAddress;
    fn get_seller_authority_key(self: @TState) -> felt252;
}

#[starknet::contract]
mod ReceiptGate {
    use core::num::traits::Zero;
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };
    use core::ecdsa::check_ecdsa_signature;
    use core::poseidon::poseidon_hash_span;
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address, get_contract_address};
    use super::OpenNoteDeposit;

    mod errors {
        pub const ZERO_POOL: felt252 = 'ZERO_POOL';
        pub const BAD_POOL: felt252 = 'BAD_POOL';
        pub const ZERO_QUOTE: felt252 = 'ZERO_QUOTE';
        pub const ZERO_COMMITMENT: felt252 = 'ZERO_COMMITMENT';
        pub const ZERO_AUTHORITY: felt252 = 'ZERO_AUTHORITY';
        pub const BAD_SELLER_AUTH: felt252 = 'BAD_SELLER_AUTH';
        pub const QUOTE_EXPIRED: felt252 = 'QUOTE_EXPIRED';
        pub const QUOTE_REPLAY: felt252 = 'QUOTE_REPLAY';
    }

    #[storage]
    struct Storage {
        pool: ContractAddress,
        seller_authority_key: felt252,
        consumed: Map<felt252, bool>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        ReceiptAccepted: ReceiptAccepted,
    }

    #[derive(Drop, starknet::Event)]
    struct ReceiptAccepted {
        #[key]
        quote_id: felt252,
        resource_commitment: felt252,
    }

    #[constructor]
    fn constructor(ref self: ContractState, pool: ContractAddress, seller_authority_key: felt252) {
        assert(!pool.is_zero(), errors::ZERO_POOL);
        assert(seller_authority_key != 0, errors::ZERO_AUTHORITY);
        self.pool.write(pool);
        self.seller_authority_key.write(seller_authority_key);
    }

    #[abi(embed_v0)]
    impl ReceiptGateImpl of super::IReceiptGate<ContractState> {
        fn privacy_invoke(
            ref self: ContractState,
            pool_address: ContractAddress,
            quote_id: felt252,
            resource_commitment: felt252,
            valid_until: u64,
            authorization_r: felt252,
            authorization_s: felt252,
        ) -> Span<OpenNoteDeposit> {
            let configured_pool = self.pool.read();
            assert(get_caller_address() == configured_pool, errors::BAD_POOL);
            assert(pool_address == configured_pool, errors::BAD_POOL);
            assert(quote_id != 0, errors::ZERO_QUOTE);
            assert(resource_commitment != 0, errors::ZERO_COMMITMENT);
            assert(get_block_timestamp() <= valid_until, errors::QUOTE_EXPIRED);
            assert(!self.consumed.read(quote_id), errors::QUOTE_REPLAY);

            // The seller authorizes this opaque request without publishing the
            // payment token, amount, recipient address, or buyer identity.
            let authorization_hash = poseidon_hash_span(
                array![
                    get_contract_address().into(),
                    quote_id,
                    resource_commitment,
                    valid_until.into(),
                ]
                    .span(),
            );
            assert(
                check_ecdsa_signature(
                    authorization_hash,
                    self.seller_authority_key.read(),
                    authorization_r,
                    authorization_s,
                ),
                errors::BAD_SELLER_AUTH,
            );

            self.consumed.write(quote_id, true);
            self.emit(ReceiptAccepted { quote_id, resource_commitment });

            let deposits: Array<OpenNoteDeposit> = array![];
            deposits.span()
        }

        fn is_consumed(self: @ContractState, quote_id: felt252) -> bool {
            self.consumed.read(quote_id)
        }

        fn get_pool(self: @ContractState) -> ContractAddress {
            self.pool.read()
        }

        fn get_seller_authority_key(self: @ContractState) -> felt252 {
            self.seller_authority_key.read()
        }
    }
}
