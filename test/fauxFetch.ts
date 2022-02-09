import { myTableResponseBody } from '../test/constants';

export const FetchMyTables = async () => {
    return {
        body: JSON.stringify(myTableResponseBody)
    };
}

export const FetchAuthorizedListSuccess = async () => {
    return {
        status: 200
    };
}

export const FetchCreateTableOnTablelandSuccess = async () => {
    return {
        body: JSON.stringify({
            tablename: "Hello_t115"
        })
    }
}

export const FetchRunQuerySuccess = async () => {
    return { 
        body: []
    }
}