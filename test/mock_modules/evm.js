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
              };
            },
          };
        },
      };
    },
  },
};
