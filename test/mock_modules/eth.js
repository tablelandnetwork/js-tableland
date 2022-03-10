module.exports = {
  TablelandTables__factory: {
    connect: function () {
      return {
        safeMint: function () {
          return {
            wait: async function () {
              return {
                events: [
                  { args: { tokenId: { _hex: "0x015", type: "BigNumber" } } },
                ],
              };
            },
          };
        },
      };
    },
  },
};
