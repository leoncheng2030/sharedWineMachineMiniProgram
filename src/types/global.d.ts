declare module "uview-plus" {
    interface $us {
        toast: (message: string) => void;
    }
    interface $u extends $us {}
}
