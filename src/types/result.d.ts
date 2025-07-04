interface IResult<T = any> {
    code: number;
    data: T;
    msg: string;
}
type Service<T> = (...args: P) => IResult<T>;

interface Options<T = any> {
    // 当 manual 为false时，自动执行的默认参数
    manual?: boolean;
    data: any;
    defaultParams?: P;
    loading: boolean;
    // 依赖项更新
    refreshDeps?: WatchSource<any>[];

    cancel: any;
    queryKey: string;
    // 成功回调
    onSuccess?: (response: AxiosResponse<Response<T>>) => void;

    // 失败回调
    onError?: (err: ErrorData) => void;
}
interface IRequestResult<T> {
    data: T | null;
    loading: boolean;
    cancel: Canceler;
    err?: ErrorData;
}
