import { encode } from "@msgpack/msgpack";
import { Component } from "../EntitySystem/Component";
import { EntityData } from "../EntitySystem/EntityData";
import { EntitySaver } from "../EntitySystem/EntitySaver";
import { EntitySystem } from "../EntitySystem/EntitySystem";
import { Prefab, PrefabInstance, PrefabPackedType } from "../EntitySystem/Prefab";
import { PrefabManager } from "../EntitySystem/PrefabManager";
import { EntityLoader } from "../EntitySystem/EntityLoader";
import { RegisteredType } from "../EntitySystem/TypeRegister";

const entSystem = new EntitySystem();
const testUUID = "1234test234";

@RegisteredType
class PrefabTestComp extends Component {

}

var prefabData:PrefabPackedType;

test("PrefabGeneratePrefab", () => {
    //generate prefab data
    const genEnt = entSystem.AddEntity();
    entSystem.AddSetComponentToEntity(genEnt,new PrefabTestComp());
    const prefabComp = new Prefab();
    prefabComp.EntityIndex = 1;
    prefabComp.PrefabIdentifier = testUUID;
    entSystem.AddSetComponentToEntity(genEnt,prefabComp);

    const savedData = EntitySaver.GetMsgpackForAllEntities(entSystem);
    prefabData = {
        prefabID:testUUID,
        prefabData:savedData
    };
    
    PrefabManager.GetPrefabManager().SetupPrefabFromRaw("test/someFile","somePrefab.Prefab",encode(prefabData));
    entSystem.ResetSystem();
});

test("PrefabReloadPrefab", () => {
    PrefabManager.GetPrefabManager().LoadPrefabFromId(prefabData.prefabID,entSystem);
    expect(entSystem.GetEntitiesWithData([Prefab],[]).GetNumEntities()).toBe(1);
    const ent = entSystem.GetEntityData(1);
    const prefabComp = ent.GetComponent(Prefab);
    expect(prefabComp.PrefabIdentifier).toBe(testUUID)
});

//TODO: Test where we don't save default data on nested prefabs


test("PrefabIgnoreDefault",()=>{ 
    const savedData = EntitySaver.GetMsgpackForAllEntities(entSystem,true);
    const template = EntityLoader.GetEntityTemplateFromMsgpack(savedData);
    expect(template.DoesEntityExist(1)).toBe(true);
    expect(template.GetEntityComponent(1,Prefab,undefined,entSystem.GetAllEntities())).toBe(undefined);
})

test("PrefabSaveLoadInstance",()=>{
    entSystem.ResetSystem();
    entSystem.AddEntity();
    entSystem.AddSetComponentToEntity(1,new PrefabInstance(testUUID));
    expect(entSystem.GetEntitiesWithData([Prefab],[]).GetNumEntities()).toBe(1);
})