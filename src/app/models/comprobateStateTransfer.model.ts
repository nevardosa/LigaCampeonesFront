export class ComprobateStateTransferModel {
  cabecera: Cabecera;
  type: string;
  date: string;
  extNwCode: string;
  catCode: string;
  empCode: string;
  loginId: string;
  password: string;
  extRefNum: string;
  data: Data;
}
export class Cabecera {
  login: string;
  password: string;
  requestGatewayCode: string;
  requestGatewayType: string;
  servicePort: string;
  sourceType: string;
}

export class Data {
  msisdn: string;
  trfCategory: string;
  fromDate: string;
  toDate: string;
  transactionId: string;
}

export class ResponseComprobateStateTransfer {
  command: Command;
} 

export class Command {
  type: string;
  txnStatus: string;
  errorKey: string;
  date: string;
  extRefNum: string;
  data: Datas;
}

export class Datas {
  recordType: string;
  transactionId: string;
  txnDate: string;
  network: string;
  domName: string;
  category: string;
  geoName: string;
  trfCategory: string;
  trfType: string;
  msisdn: string;
  extTxnNumber: string;
  extTxnDate: string;
  comMprf: string;
  status: string;
  paymentInstType: string;
  paymentInstNumber: string;
  paymentInstDate: string;
  paymentInstAmt: string;
  firstAppRemarks: string;
  secondAppRemarks: string;
  thirdAppRemarks: string;
  reqSource: string;
  record: Record;
}

export class Record {
  prodCode: string;
  mrp: string;
  reqValue: string;
  tax1r: string;
  tax1a: string;
  tax2r: string;
  tax2a: string;
  tax3r: string;
  tax3a: string;
  comMr: string;
  comMa: string;
  amount: string;
  netAmt: string;
}






