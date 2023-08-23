const ethers = require("ethers");
let abi = require('./contract/abi.json')
let { SignTypedDataVersion, signTypedData, recoverTypedSignature, TypedDataUtils } = require("@metamask/eth-sig-util");
const { default: axios } = require("axios");
const pk = "";
const createOrderData = {
    domain: {
        name: "Dafi-Protocol",
        version: "V1",
        chainId: 5, // Replace with the Hardhat's chain ID
        verifyingContract: "0xF58cb7a5c027DaBcD135afAf23D04c0412643B1A",
    },
    // This defines the message you're proposing the user to sign, is dapp-specific, and contains
    // anything you want. There are no required fields. Be as explicit as possible when building out
    // the message schema.
    message: {
        sellToken: "0x91056d4a53e1faa1a84306d4deaec71085394bc8",
        buyToken: "0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6",
        receiver: "0xdbfa076edbfd4b37a86d1d7ec552e3926021fb97",
        sellAmount: "19000000000000000000",
        buyAmount: "10000000000000",
        validTo: "1692797427",
        partiallyFillable: false,
        feeAmount: "0"
    },
    // This refers to the keys of the following types object.
    primaryType: "Data",
    types: {
        // This refers to the domain the contract is hosted on.
        EIP712Domain: [
            { name: "name", type: "string" },
            { name: "version", type: "string" },
            { name: "chainId", type: "uint256" },
            { name: "verifyingContract", type: "address" },
        ],
        // Refer to primaryType.
        Data: [
            { name: "sellToken", type: "address" },
            { name: "buyToken", type: "address" },
            { name: "receiver", type: "address" },
            { name: "sellAmount", type: "uint256" },
            { name: "buyAmount", type: "uint256" },
            { name: "validTo", type: "uint32" },
            { name: "partiallyFillable", type: "bool" },
            { name: "feeAmount", type: "uint256" },
        ],
    },
}
let createOrderSignature = signTypedData({
    privateKey: Buffer.from(pk, "hex"),
    data: createOrderData,
    version: SignTypedDataVersion.V4,
});
console.log("createOrderSignature ", createOrderSignature);
let recoveredCreateAddress = recoverTypedSignature({
    data: createOrderData,
    signature: createOrderSignature,
    version: SignTypedDataVersion.V4
})
console.log("recovered order", recoveredCreateAddress);
let main = async () => {
    let provider = new ethers.providers.JsonRpcProvider(
        'https://eth-goerli.g.alchemy.com/v2/uZQ-N-ACmJP2S72X4Ave9TOENtpdDKkW',
    );
    let wallet = new ethers.Wallet(pk, provider);
    let contract = new ethers.Contract(
        '0xF58cb7a5c027DaBcD135afAf23D04c0412643B1A',
        abi,
        wallet,
    );
    let signer = await contract.getHashGPV2(createOrderData.message, createOrderSignature)
    console.log(signer)
    // let tx=await contract.getHashGPV2
    const offchain = {
        from: "0xF58cb7a5c027DaBcD135afAf23D04c0412643B1A",
        sellToken: createOrderData.message.sellToken,
        buyToken: createOrderData.message.buyToken,
        receiver: createOrderData.message.receiver,
        sellAmount: createOrderData.message.sellAmount,
        buyAmount: createOrderData.message.buyAmount,
        validTo: parseInt(createOrderData.message.validTo),
        appData: "0x5b601b3d4f69144178f809830391a4b3f456d533e79d3c7a06380dff608e44c6".toString(),
        feeAmount: "0",
        kind: "sell",
        partiallyFillable: createOrderData.message.partiallyFillable,
        sellTokenBalance: "erc20",
        buyTokenBalance: "erc20",
        signingScheme: "eip1271",
        signature: createOrderSignature,
    };
    const response = await axios.post('https://api.cow.fi/goerli/api/v1/orders', offchain);
    console.log(response.data);
}
main()