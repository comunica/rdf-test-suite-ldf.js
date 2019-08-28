import * as net from 'net';
import { LdfResponseMocker } from "../testcase/ldf/mock/LdfResponseMocker";
// tslint:disable:no-var-requires
const tcpPortUsed = require('tcp-port-used');
// tslint:enable:no-var-requires
export class LdfResponseMockerFactory {

  private currentPort: number;

  constructor(port?: number) {
    // default port is 3000
    this.currentPort = port ? port : 3000;
  }

  /**
   * Return a LdfResponseMocker with the next open port
   */
  public async getNewLdfResponseMocker(): Promise<LdfResponseMocker> {
    return new Promise(async (resolve, reject) => {
      try {
        if (this.isPort(this.currentPort)) {
          tcpPortUsed.waitUntilFree(this.currentPort, 500, 4000).then(() => {
            resolve(new LdfResponseMocker(this.currentPort));
          }, (err: Error) => {
            reject(err);
          });
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Check if the port number is currently unused, this is important to avoid unnecessary failing of tests
   * @param port The port which will be checked
   */
  private isPortAvailable(port: number): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      const tester: net.Server = net.createServer()
        .once('error', (err: any) => resolve(false))
        .once('listening', () => tester.once('close', () => resolve(true)).close())
        .listen(port);
    });
  }

  /**
   * Check if the port is a valid port number
   * @param port The port-number that should be tested
   */
  private isPort(port: number): boolean {
    if (! (1024 <= port && port <= 49151)) {
      throw new Error(`The given port: ${port} is invalid`);
    }
    return true;
  }

}
