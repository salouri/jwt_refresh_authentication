// this function is comply with ProcessEnv type definition in NodeJS: [key: string]: string | undefined
// ...prevents TS error: ""Type 'string | undefined' is not assignable to type 'string'"

const getEnvVar = (v: string, optional = false): string => {
  let ret = process.env[v];
  if (ret === undefined) {
    if (!optional) throw new Error('process.env.' + v + ' is undefined!');
    else ret = '';
  }
  return ret;
};

export default getEnvVar;
