export class UserInfoModel {
    cabecera: Cabecera;
    type: string;
    extNwCode: string;
    date: string;
    msisdn: string = " ";
    pin: string = " ";
    language1: string = " ";
    extRefNum: string = " ";
    extCode: string;
    domainCode: string;
}


export class Cabecera {
    login: string;
    password: string;
    requestGatewayCode: string;
    requestGatewayType: string;
    servicePort: string;
    sourceType: string;
}



export class ResponseUserInfo {
    command: Command;
}

export class Command {
    type: string;
    txnStatus: string;
    date: string;
    extRefNum: string;
    status: string;
    lang: string;
    userBalances: UserBalances;
    assoServices: string;
    creationDate: string;
    category: string;
    externalCode: string;
    associatedMsisdn: string;
    associatedMsisdnType: string;
    ppsMassDate: string;
    empCode: string;
    posId: string;
    pinResetRqd: string;
    pswdResetRqd: string;
}

export class UserBalances {
    record: Record[] = [];
}

export class Record {
    productCode: string;
    productShortName: string;
    msisdn: string;
    balance: string;
}





