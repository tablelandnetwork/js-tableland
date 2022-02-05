export const ethers = {
    providers: {
        Web3Provider: function () {
            // mock provider
            return {
                send: async function () { },
                getSigner: function () {
                    // mock signer
                    return {
                        getAddress: function () {
                            return "testaddress";
                        },
                        signMessage: async function () {
                            return "testsignedmessage";
                        },
                    };
                },
            };
        },
    },
};