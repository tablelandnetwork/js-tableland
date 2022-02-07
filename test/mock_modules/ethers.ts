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
                        getNetwork: async function () {
                            return {name: ""}
                        }
                    };
                },
            };
        },
    },
};
export const utils = {
    arrayify: function() {
        return new Uint8Array(5);
    }
}