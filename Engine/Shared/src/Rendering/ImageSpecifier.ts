import { RegisteredType, Saved } from "../EntitySystem/TypeRegister";

@RegisteredType(ImageSpecifier)
export class ImageSpecifier {
    @Saved(String)
    FilePath:string;
    @Saved(String)
    FileName:string;
}