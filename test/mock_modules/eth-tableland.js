module.exports = {
    TablelandTables__factory: {
        connect: function() {
            return {
                safeMint: function() {
                    return {
                        wait: async function() {
                            return {
                                events: [{args: {tokenId: "115"}}]
                            }
                        }
                    }
                }
            }
        }, 

    }
}