module.exports = {
  TablelandTables__factory: {
    connect: function () {
      return {
        createTable: function () {
          return {
            wait: async function () {
              return {
                events: [
                  {},
                  { args: { tableId: { _hex: "0x015", type: "BigNumber" } } },
                ],
                transactionHash: "0x017"
              };
            },
          };
        },
        runSQL: function () {
          return {
            wait: async function () {
              return {
                transactionHash: "0x016"
              };
            }
          }
        }
      };
    },
  },
};
