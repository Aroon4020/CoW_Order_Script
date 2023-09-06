require('dotenv').config();
const ethers = require("ethers");
let abi = require('./abi/settlement.json')
let { SignTypedDataVersion, signTypedData, recoverTypedSignature, TypedDataUtils } = require("@metamask/eth-sig-util");
const { default: axios } = require("axios");
const pk = "";

const createOrderData = {
    domain: {
        name: "Dafi-Protocol",
        version: "V1",
        chainId: 5, // Replace with the Hardhat's chain ID
        verifyingContract: "0xc0B30fbe9A028C61D75eB92837aca06f741e0a38",
    },
    message: {
        sellToken: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
        buyToken: "0x91056d4a53e1faa1a84306d4deaec71085394bc8",
        receiver: "0xdbfa076edbfd4b37a86d1d7ec552e3926021fb97",
        sellAmount: "10000000000000000",
        buyAmount: "1",
        account: "0xd1795B1E24B0DFA4F207b63a201790A247FA27a3",
        validTo: "1694058002",
        partiallyFillable: false,
        feeAmount: "0"
    },
    
    primaryType: "Data",
    types: {
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
            { name:  "account", type: "address" },
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
    let provider = new ethers.JsonRpcProvider(
        'https://eth-goerli.g.alchemy.com/v2/UhpuznU9sEL8E-127qaU1-4yuVP9Hy1w',
    );
    let wallet = new ethers.Wallet(pk, provider);
    let contract = new ethers.Contract(
        '0xc0B30fbe9A028C61D75eB92837aca06f741e0a38',
        abi,
        wallet,
    );
    let tx = await contract.commitFullOrderForGPv2(createOrderData.message, createOrderSignature);
    console.log(tx);
    
    const offchain = {
        from: "0xd1795B1E24B0DFA4F207b63a201790A247FA27a3",
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
        signature: "0x",
    };
    const response = await axios.post('https://api.cow.fi/goerli/api/v1/orders', offchain);
    console.log(response.data);
}
main()