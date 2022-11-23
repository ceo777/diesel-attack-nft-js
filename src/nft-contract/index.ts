//const crypto = require('crypto');
//const { createHash } = await import('crypto');
import { NearContract, NearBindgen, near, call, view, LookupMap, UnorderedMap, Vector, UnorderedSet } from 'near-sdk-js'
import { NFTContractMetadata, Token, TokenMetadata, internalNftMetadata } from './metadata';
import { internalMint } from './mint';
import { internalNftTokens, internalSupplyForOwner, internalTokensForOwner, internalTotalSupply } from './enumeration';
import { internalNftToken, internalNftTransfer, internalNftTransferCall, internalResolveTransfer } from './nft_core';
import { internalNftApprove, internalNftIsApproved, internalNftRevoke, internalNftRevokeAll } from './approval';
import { internalNftPayout, internalNftTransferPayout } from './royalty';
//import {randomSeed} from "near-sdk-js/lib/api";

// This spec can be treated like a version of the standard.
export const NFT_METADATA_SPEC = "nft-1.2.0";

// This is the name of the NFT standard we're using
export const NFT_STANDARD_NAME = "nep171";

// Encoded SVG contract icon
const NFT_METADATA_ICON = "data:image/svg+xml,%3Csvg%20version%3D%221.1%22%20id%3D%22Layer_1%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20x%3D%220px%22%20y%3D%220px%22%0A%09%20viewBox%3D%220%200%20512%20512%22%20style%3D%22enable-background%3Anew%200%200%20512%20512%3B%22%20xml%3Aspace%3D%22preserve%22%3E%3Cg%3E%3Cg%3E%3Cg%3E%3Cpath%20d%3D%22M59.733%2C85.333h358.4c4.719%2C0%2C8.533-3.823%2C8.533-8.533s-3.814-8.533-8.533-8.533h-358.4c-4.71%2C0-8.533-3.831-8.533-8.533%0A%09%09%09%09s3.823-8.533%2C8.533-8.533h187.733c4.719%2C0%2C8.533-3.823%2C8.533-8.533V25.6c0-4.702%2C3.823-8.533%2C8.533-8.533h85.333%0A%09%09%09%09c4.71%2C0%2C8.533%2C3.831%2C8.533%2C8.533v8.533h-76.8c-4.719%2C0-8.533%2C3.823-8.533%2C8.533c0%2C4.71%2C3.814%2C8.533%2C8.533%2C8.533h170.667%0A%09%09%09%09c4.71%2C0%2C8.533%2C3.831%2C8.533%2C8.533s-3.823%2C8.533-8.533%2C8.533c-4.719%2C0-8.533%2C3.823-8.533%2C8.533v358.4%0A%09%09%09%09c0%2C4.71%2C3.814%2C8.533%2C8.533%2C8.533s8.533-3.823%2C8.533-8.533V83.874c9.933-3.524%2C17.067-13.013%2C17.067-24.141%0A%09%09%09%09c0-14.114-11.486-25.6-25.6-25.6h-76.8V25.6c0-14.114-11.486-25.6-25.6-25.6h-85.333c-14.114%2C0-25.6%2C11.486-25.6%2C25.6v8.533%0A%09%09%09%09h-179.2c-14.114%2C0-25.6%2C11.486-25.6%2C25.6S45.619%2C85.333%2C59.733%2C85.333z%22%2F%3E%3Cpath%20d%3D%22M139.085%2C267.051c-1.613%2C1.613-2.5%2C3.797-2.483%2C6.067c0.128%2C21.205%2C5.649%2C41.847%2C15.94%2C59.682%0A%09%09%09%09c10.3%2C17.843%2C25.182%2C32.794%2C43.034%2C43.238c1.314%2C0.776%2C2.807%2C1.169%2C4.309%2C1.169c0.742%2C0%2C1.485-0.094%2C2.219-0.29%0A%09%09%09%09c2.193-0.589%2C4.07-2.039%2C5.197-4.028l33.801-59.477c2.278-3.994%2C0.973-9.071-2.944-11.477%0A%09%09%09%09c-5.043-3.098-8.986-7.074-11.716-11.802c-2.654-4.599-4.403-11.221-4.574-17.306c-0.137-4.617-3.917-8.294-8.533-8.294h-68.198%0A%09%09%09%09C142.857%2C264.533%2C140.681%2C265.438%2C139.085%2C267.051z%20M205.653%2C281.6c1.092%2C6.187%2C3.166%2C12.143%2C6.016%2C17.075%0A%09%09%09%09c2.833%2C4.89%2C6.46%2C9.225%2C10.829%2C12.937l-25.583%2C45.013c-12.075-8.516-22.204-19.567-29.594-32.358%0A%09%09%09%09c-7.305-12.663-11.904-27.554-13.244-42.667H205.653z%22%2F%3E%3Cpath%20d%3D%22M452.267%2C460.8h-358.4c-4.719%2C0-8.533%2C3.823-8.533%2C8.533s3.814%2C8.533%2C8.533%2C8.533h358.4c4.71%2C0%2C8.533%2C3.831%2C8.533%2C8.533%0A%09%09%09%09s-3.823%2C8.533-8.533%2C8.533H59.733c-4.71%2C0-8.533-3.831-8.533-8.533s3.823-8.533%2C8.533-8.533c4.719%2C0%2C8.533-3.823%2C8.533-8.533%0A%09%09%09%09v-358.4c0-4.71-3.814-8.533-8.533-8.533s-8.533%2C3.823-8.533%2C8.533v351.326c-9.933%2C3.524-17.067%2C13.013-17.067%2C24.141%0A%09%09%09%09c0%2C14.114%2C11.486%2C25.6%2C25.6%2C25.6h392.533c14.114%2C0%2C25.6-11.486%2C25.6-25.6S466.381%2C460.8%2C452.267%2C460.8z%22%2F%3E%3Cpath%20d%3D%22M304.7%2C372.89c1.126%2C1.988%2C3.004%2C3.439%2C5.197%2C4.028c0.734%2C0.196%2C1.476%2C0.29%2C2.219%2C0.29c1.502%2C0%2C2.995-0.393%2C4.309-1.169%0A%09%09%09%09c17.835-10.436%2C32.717-25.387%2C43.042-43.238c10.291-17.843%2C15.804-38.477%2C15.923-59.682c0.017-2.27-0.879-4.454-2.483-6.067%0A%09%09%09%09c-1.596-1.613-3.772-2.517-6.05-2.517h-68.19c-4.617%2C0-8.397%2C3.678-8.533%2C8.294c-0.162%2C6.059-1.929%2C12.698-4.565%2C17.306%0A%09%09%09%09c-2.739%2C4.736-6.682%2C8.704-11.716%2C11.793c-3.917%2C2.415-5.222%2C7.492-2.953%2C11.486L304.7%2C372.89z%20M300.348%2C298.658%0A%09%09%09%09c2.833-4.949%2C4.915-10.889%2C5.99-17.058h51.576c-1.331%2C15.112-5.922%2C30.003-13.218%2C42.667%0A%09%09%09%09c-7.407%2C12.792-17.545%2C23.851-29.611%2C32.358l-25.583-45.013C293.879%2C307.9%2C297.506%2C303.565%2C300.348%2C298.658z%22%2F%3E%3Cpath%20d%3D%22M256%2C290.133c9.412%2C0%2C17.067-7.654%2C17.067-17.067c0-9.412-7.654-17.067-17.067-17.067%0A%09%09%09%09c-9.404%2C0-17.067%2C7.654-17.067%2C17.067C238.933%2C282.479%2C246.596%2C290.133%2C256%2C290.133z%22%2F%3E%3Cpath%20d%3D%22M235.878%2C244.207c1.374%2C0%2C2.756-0.333%2C4.045-1.033c10.419-5.623%2C21.734-5.632%2C32.154%2C0%0A%09%09%09%09c4.053%2C2.176%2C9.088%2C0.759%2C11.418-3.192l34.603-59.008c1.161-1.963%2C1.476-4.318%2C0.888-6.519c-0.589-2.21-2.031-4.088-4.019-5.214%0A%09%09%09%09c-35.951-20.463-81.98-20.463-117.931%2C0c-1.997%2C1.126-3.43%2C3.004-4.028%2C5.214c-0.589%2C2.202-0.273%2C4.557%2C0.888%2C6.519%0A%09%09%09%09l34.611%2C59.017C230.093%2C242.688%2C232.943%2C244.207%2C235.878%2C244.207z%20M298.829%2C180.113l-26.206%2C44.663%0A%09%09%09%09c-10.812-3.866-22.426-3.874-33.254%2C0l-26.197-44.663C240.017%2C167.714%2C271.991%2C167.714%2C298.829%2C180.113z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E%0A";

@NearBindgen
export class Contract extends NearContract {
    owner_id: string;
    tokensPerOwner: LookupMap;
    tokensById: LookupMap;
    tokenMetadataById: UnorderedMap;
    metadata: NFTContractMetadata;


    /*
        initialization function (can only be called once).
        this initializes the contract with metadata that was passed in and
        the owner_id. 
    */
    constructor({
        owner_id, 
        metadata = {
            spec: NFT_METADATA_SPEC,
            name: "Diesel Attack NFT Collection",
            symbol: "DIESEL",
            icon: NFT_METADATA_ICON
        } 
    }) {
        super()
        this.owner_id = owner_id;
        this.tokensPerOwner = new LookupMap("tokensPerOwner");
        this.tokensById = new LookupMap("tokensById");
        this.tokenMetadataById = new UnorderedMap("tokenMetadataById");
        this.metadata = metadata;
    }

    default() {
        return new Contract({owner_id: ''})
    }

    /*
        MINT
    */
    @call
    //The main minting method that define random NFT for player and calls nft_mint
    nft_for_player({receiver_id}) {
        let nft_data: { [key: string]: string } = {};
        let rand: number = Math.floor(Math.random() * 100);
        switch (true) {
            case (rand < 15):
                nft_data.code = "gun-1";
                nft_data.title = "Machine Hunt";
                nft_data.description = "Long-barreled firearm designed for accurate shooting, with a barrel that has a helical pattern of grooves (rifling) cut into the bore wall.";
                nft_data.media = "https://bafkreibbwmh6t4s46hi5vw7qxcglkreadbqnf5ydqqxyuaqqwewbnwdckm.ipfs.nftstorage.link";
                //nft_data.media_hash = crypto.createHash('sha256').update(nft_data.media).digest('base64');
                break;
            case (rand < 31):
                nft_data.extra = "gun-2";
                nft_data.title = "Gauss Rifle";
                nft_data.description = "Is a type of projectile accelerator consisting of one or more coils used as electromagnets in the configuration of a linear motor that accelerates a ferromagnetic or conducting projectile to high velocity.";
                nft_data.media = "https://bafkreicqk2tfkao6ckwsqsfc6az3buwqkzhyoha46fyur74ygiu2yklv4u.ipfs.nftstorage.link";
                //nft_data.media_hash = crypto.createHash('sha256').update(nft_data.media).digest('base64');
                break;
            case (rand < 47):
                nft_data.extra = "gun-3";
                nft_data.title = "Rocket Launcher";
                nft_data.description = "A launcher consisting of a tube or cluster of tubes (as a three-tube unit placed on the underside of diesel ship) for firing rocket shells. Trust me, you dont wanna feel its impact.";
                nft_data.media = "https://bafkreidjqk52hl6o6upzas4cd6kd7exx4wgghdc4aqjwdev73vjbbbfe7m.ipfs.nftstorage.link";
                //nft_data.media_hash = crypto.createHash('sha256').update(nft_data.media).digest('base64');
                break;
            case (rand < 63):
                nft_data.extra = "gun-4";
                nft_data.title = "Destroyer of The Worlds";
                nft_data.description = "Ever heard of a Death Star? Meet its younger brother. When unstoppable force meets immovable object... force wins, if its Destroyer of The Worlds.";
                nft_data.media = "https://bafkreiekbwphahf25zwlgl3bbgxlwcqlq5lmqyu5p2nopalm5la4km4gl4.ipfs.nftstorage.link";
                //nft_data.media_hash = crypto.createHash('sha256').update(nft_data.media).digest('base64');
                break;
            case (rand < 79):
                nft_data.extra = "gun-5";
                nft_data.title = "ShotGun";
                nft_data.description = "A short-barreled firearm designed to shoot a straight-walled cartridges, which usually discharges numerous small pellet-like spherical sub-projectiles.";
                nft_data.media = "https://bafkreibtzmq624yrdc5s3ur67rtqt5p5vcmvbt5lllekyuy2kgsnnfqoom.ipfs.nftstorage.link";
                //nft_data.media_hash = crypto.createHash('sha256').update(nft_data.media).digest('base64');
                break;
            case (rand < 89):
                nft_data.extra = "ship-1";
                nft_data.title = "Nautilus";
                nft_data.description = "This Ship utilizes marine engine that uses the heat of compression to ignite and power the ignition of diesel fuel. Legend told, it was used by Nemo itself.";
                nft_data.media = "https://bafybeid6uipm6x2flcu4yqup7bg2kc5bfz2twsz5jzm5owdbnw6hui3lza.ipfs.nftstorage.link";
                //nft_data.media_hash = crypto.createHash('sha256').update(nft_data.media).digest('base64');
                break;
            case (rand < 99):
                nft_data.extra = "ship-2";
                nft_data.title = "Ragnarok";
                nft_data.description = "When its time for a final battle, you'd better use Ragnarok. Maneuverable, fast and deadly hitting. Your foes have no chances.";
                nft_data.media = "https://bafybeibn6by4wxdqujenwqedq72y2suiypic7z2pgufidazpd34ny5mjsy.ipfs.nftstorage.link";
                //nft_data.media_hash = crypto.createHash('sha256').update(nft_data.media).digest('base64');
                break;
        }

        let token_id = `${Date.now()}:${rand}`;
        let metadata = new TokenMetadata(nft_data);
        let perpetual_royalties = {};

        this.nft_mint({ token_id, metadata, receiver_id, perpetual_royalties });
        return
    }

    @call
    //implementation of the nft_mint method
    nft_mint({ token_id, metadata, receiver_id, perpetual_royalties }) {
        return internalMint({ contract: this, tokenId: token_id, metadata: metadata, receiverId: receiver_id, perpetualRoyalties: perpetual_royalties });
    }

    /*
        CORE
    */
    @view
    //get the information for a specific token ID
    nft_token({ token_id }) {
        return internalNftToken({ contract: this, tokenId: token_id });
    }

    @call
    //implementation of the nft_transfer method. This transfers the NFT from the current owner to the receiver. 
    nft_transfer({ receiver_id, token_id, approval_id, memo }) {
        return internalNftTransfer({ contract: this, receiverId: receiver_id, tokenId: token_id, approvalId: approval_id, memo: memo });
    }

    @call
    //implementation of the transfer call method. This will transfer the NFT and call a method on the receiver_id contract
    nft_transfer_call({ receiver_id, token_id, approval_id, memo, msg }) {
        return internalNftTransferCall({ contract: this, receiverId: receiver_id, tokenId: token_id, approvalId: approval_id, memo: memo, msg: msg });
    }

    @call
    //resolves the cross contract call when calling nft_on_transfer in the nft_transfer_call method
    //returns true if the token was successfully transferred to the receiver_id
    nft_resolve_transfer({ authorized_id, owner_id, receiver_id, token_id, approved_account_ids, memo }) {
        return internalResolveTransfer({ contract: this, authorizedId: authorized_id, ownerId: owner_id, receiverId: receiver_id, tokenId: token_id, approvedAccountIds: approved_account_ids, memo: memo });
    }

    /*
        APPROVALS
    */
    @view
    //check if the passed in account has access to approve the token ID
    nft_is_approved({ token_id, approved_account_id, approval_id }) {
        return internalNftIsApproved({ contract: this, tokenId: token_id, approvedAccountId: approved_account_id, approvalId: approval_id });
    }

    @call
    //approve an account ID to transfer a token on your behalf
    nft_approve({ token_id, account_id, msg }) {
        return internalNftApprove({ contract: this, tokenId: token_id, accountId: account_id, msg: msg });
    }

    /*
        ROYALTY
    */
    @view
    //calculates the payout for a token given the passed in balance. This is a view method
    nft_payout({ token_id, balance, max_len_payout }) {
        return internalNftPayout({ contract: this, tokenId: token_id, balance: balance, maxLenPayout: max_len_payout });
    }

    @call
    //transfers the token to the receiver ID and returns the payout object that should be payed given the passed in balance. 
    nft_transfer_payout({ receiver_id, token_id, approval_id, memo, balance, max_len_payout }) {
        return internalNftTransferPayout({ contract: this, receiverId: receiver_id, tokenId: token_id, approvalId: approval_id, memo: memo, balance: balance, maxLenPayout: max_len_payout });
    }

    @call
    //revoke the right of an account ID to transfer a token on your behalf
    nft_revoke({ token_id, account_id }) {
        return internalNftRevoke({ contract: this, tokenId: token_id, accountId: account_id });
    }

    @call
    //revoke the right of all approved accounts to transfer a token on your behalf
    nft_revoke_all({ token_id }) {
        return internalNftRevokeAll({ contract: this, tokenId: token_id });
    }

    /*
        ENUMERATION
    */
    @view
    //Query for the total supply of NFTs on the contract
    nft_total_supply() {
        return internalTotalSupply({ contract: this });
    }

    @view
    //Query for nft tokens on the contract regardless of the owner using pagination
    nft_tokens({ from_index, limit }) {
        return internalNftTokens({ contract: this, fromIndex: from_index, limit: limit });
    }

    @view
    //get the total supply of NFTs for a given owner
    nft_tokens_for_owner({ account_id, from_index, limit }) {
        return internalTokensForOwner({ contract: this, accountId: account_id, fromIndex: from_index, limit: limit });
    }

    @view
    //Query for all the tokens for an owner
    nft_supply_for_owner({ account_id }) {
        return internalSupplyForOwner({ contract: this, accountId: account_id });
    }

    /*
        METADATA
    */
    @view
    //Query for all the tokens for an owner
    nft_metadata() {
        return internalNftMetadata({ contract: this });
    }
}