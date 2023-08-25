
export function RemovePlatformSpecificIncludePath(path:string) : string {
    return path.replace("Common/", "").replace("ServerSpecific/","").replace("WASMSpecific/","");
}