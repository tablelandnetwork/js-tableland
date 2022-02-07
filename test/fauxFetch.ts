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
            id: "115",
            name: "Hello"
        })
    }
}

export const FetchRunQuerySuccess = async () => {
    return { 
        body: []
    }
}