export class UpdateOperationTransferModel {
  cabecera: Cabecera;
  type: string;
  extNwCode: string;
  msisdn: string;
  pin: string;
  extCode: string;
  extTxnNumber: string;
  extTxnDate: string;
  products: Products[] = [];
  trfCategory: string;
  refNumber: string;
  paymentDetails: PaymentDetails[] = [];
  remarks: string;
} 


export class Cabecera {
  login: string;
  password: string;
  requestGatewayCode: string;
  requestGatewayType: string;
  servicePort: string;
  sourceType: string;
}

export class Products {
  productCode: string;
  qty: string;
}

export class PaymentDetails {
  paymentType: string;
  paymentInstNumber: string;
  paymentDate: string;
}

export class  ResponseUpdateOperationTransfer {
  Command: Commands;
} 

export class Commands {
  type: string;
  txnId: string;
  txnStatus: string;
  extTxnNumber: string;
} 





