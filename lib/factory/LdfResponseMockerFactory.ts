import * as net from 'net';
import { LdfResponseMocker } from "../testcase/ldf/mock/LdfResponseMocker";

export class LdfResponseMockerFactory {

  private currentPort: number;

  constructor(port?: number) {
    this.currentPort = port ? port : 3000;
  }

  /**
   * Return a LdfResponseMocker with the next open port
   */
  public getNewLdfResponseMocker(): Promise<LdfResponseMocker> {
    return new Promise(async (resolve, reject) => {
      while (this.isPort(this.currentPort) && ! await this.isPortAvailable(this.currentPort)) {
        this.currentPort += 1;
      }
      const mocker: LdfResponseMocker = new LdfResponseMocker(this.currentPort);
      this.currentPort += 1;
      resolve(mocker);
    });
  }

  /**
   * Check if the port number is currently unused, this is important to avoid unnecessary failing of tests
   * @param port The port which will be checked
   */
  private isPortAvailable(port: number): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      const tester: net.Server = net.createServer()
        .once('error', (err: any) => (err.code === 'EADDRINUSE' ? resolve(false) : reject(true)))
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
      throw new Error('There are not enough ports for these tests. Please choose a lower starting port.');
    }
    return true;
  }

}
