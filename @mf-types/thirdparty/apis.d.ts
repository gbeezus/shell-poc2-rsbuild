
    export type RemoteKeys = 'thirdparty/Tool';
    type PackageType<T> = T extends 'thirdparty/Tool' ? typeof import('thirdparty/Tool') :any;