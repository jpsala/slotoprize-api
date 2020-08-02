import PubSub from 'pubsub-js'


// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const runCommand = (cmd: string, data: any): void => {
  throw new Error('getException generated exception')
}

PubSub.subscribe('getException', runCommand)