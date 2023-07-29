interface PayloadType {
  at_hash: string;
  sub: string;
  iss: string;
  'cognito:username': string;
  aud: string;
  event_id: string;
  token_use: string;
  auth_time: number;
  'custom:retry_counter': string;
  phone_number: string;
  exp: number;
  iat: number;
  jti: string;
}

export default PayloadType;
