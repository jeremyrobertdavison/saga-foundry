const {StringField,NumberField,ObjectField,SchemaField}=foundry.data.fields;
const object=initial=>new ObjectField({required:true,nullable:false,initial:()=>structuredClone(initial)});
const resource=()=>new SchemaField({value:new NumberField({initial:0}),min:new NumberField({initial:0}),max:new NumberField({initial:0})});
export class SagaCharacterData extends foundry.abstract.TypeDataModel {
 static defineSchema(){return {
  biography:new StringField({initial:''}),health:resource(),power:resource(),
  attributes:object({}),groups:object({}),build:new ObjectField({nullable:true,initial:null}),
  session:object({heroism:1,conditions:[],rolls:[]}),legacyBackup:new ObjectField({nullable:true,initial:null})
 };}
}
export class SagaItemData extends foundry.abstract.TypeDataModel {
 static defineSchema(){return {description:new StringField({initial:''}),quantity:new NumberField({initial:1,min:0}),legacyBackup:new ObjectField({nullable:true,initial:null})};}
}
