// __mocks__/vscode.d.ts
declare module 'vscode' {
  export class Memento {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    private readonly store: Record<string, any>;

    constructor();
    get(key: string): any;
    update(key: string, value: any): Promise<void>;
  }
}
