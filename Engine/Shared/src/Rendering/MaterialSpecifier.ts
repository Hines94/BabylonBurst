import { RegisteredType, Saved } from "../EntitySystem/TypeRegister";

@RegisteredType(MaterialSpecifier)
export class MaterialSpecifier {
    @Saved(String)
    FilePath:string;
    @Saved(String)
    FileName:string;
}