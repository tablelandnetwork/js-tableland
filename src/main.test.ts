import fetch from "jest-fetch-mock";
import { myTables } from './lib/myTables';

beforeEach(() => {
  fetch.resetMocks();
});


let fauxSponse = [{"id":"71bb8c56-a44e-4a75-aa9c-8158cefda5d7","controller":"0xbDA5747bFD65F08deb54cb465eB87D40e51B197E","type":"","created_at":"2021-12-22T15:38:27.614321Z"},{"uuid":"e7fb1cdd-a231-43c3-ba4e-6dc51112c110","controller":"0xbDA5747bFD65F08deb54cb465eB87D40e51B197E","type":"","created_at":"2021-12-22T15:38:48.547678Z"},{"uuid":"95841d21-6687-4bd5-bbf2-8ecae917bb23","controller":"0xbDA5747bFD65F08deb54cb465eB87D40e51B197E","type":"LootProjectAttributes","created_at":"2022-01-06T23:03:44.823089Z"},{"uuid":"d9163b48-670f-4549-813a-6f66888bc1fb","controller":"0xbDA5747bFD65F08deb54cb465eB87D40e51B197E","type":"LootProjectInventory","created_at":"2022-01-12T14:45:49.499665Z"},{"uuid":"a1cece0a-d593-425c-8c21-399c69acd14e","controller":"0xbDA5747bFD65F08deb54cb465eB87D40e51B197E","type":"","created_at":"2022-01-21T21:28:34.057286Z"},{"uuid":"01e8d4e2-298c-41ad-a4c3-3775473f6e80","controller":"0xbDA5747bFD65F08deb54cb465eB87D40e51B197E","type":"","created_at":"2022-01-31T21:10:28.416444Z"}];

test("the data is peanut butter", async function() {

  fetch.mockResponse(async () => {
    return {
      body: JSON.stringify(fauxSponse)
    };
  });
 
  
  const resp = await myTables();
  expect(resp[0].id).toEqual('71bb8c56-a44e-4a75-aa9c-8158cefda5d7');

  
});

import { createTable } from '../src/main';

describe('createTable', function () {


  test('should error if not connected', async function () {
    await expect(createTable('foozbarz')).rejects.toThrow('Please connect your account before trying anything.');
  });

});
