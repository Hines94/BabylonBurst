import { RegisteredType, Saved } from "@engine/EntitySystem/TypeRegister";

@RegisteredType(UISpecifier,{comment:"Used to easily select a UI from our available options"})
export class UISpecifier {
    @Saved(String)
    FilePath:string;
    @Saved(String)
    FileName:string;
}