import { CognitoJwtVerifier } from 'aws-jwt-verify';
import getEnvVar from 'utils/getEnvVar';
import logger from 'utils/logger';
// import PayloadType from 'types/payload.type';

// Verifier that expects valid access tokens:
const verifier = CognitoJwtVerifier.create({
  userPoolId: getEnvVar('COGNITO_USER_POOL_ID'),
  tokenUse: 'access',
  clientId: getEnvVar('COGNITO_CLIENT_ID'),
});

async function decodeJWTToken(idToken: string) {
  try {
    const payload = await verifier.verify(idToken); // the JWT as string
    /* payload object example (fake data):
    {
      "at_hash": "L0003V8ny_Uwu000UuORFQ",
      "sub": "e1000e6e-0700-4100-a300-000f1fa3738b",
      "iss": "https://cognito-idp.eu-central-1.amazonaws.com/eu-central-1_000k3XM",
      "cognito:username": "demouser",
      "aud": "20kjj3nn000qv0s5l000rmo5dn",
      "event_id": "ee000a18-8000-4800-9000-1fec2fc000ea",
      "token_use": "id",
      "auth_time": 1600000332,
      "custom:retry_counter": "0",
      "phone_number": "+9620005350005",
      "exp": 1658000932,
      "iat": 1600050333,
      "jti": "81600003-60cd-409a-a00a-f500009c01d4"
    }
    */
    logger.info('Token is valid. Payload:');
    return payload;
  } catch {
    logger.error('Token not valid!');
  }
}

export default decodeJWTToken;
