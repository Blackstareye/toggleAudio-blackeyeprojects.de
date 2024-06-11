export default class Printer {

    static printBeautyObject(variantObject) {
        return JSON.stringify(variantObject, null, 2);
    }

    static printBeautyMap(mapObject) {
        let beautyPrint = "";
        console.log(`Debugging: ${mapObject.size} ${[...mapObject.keys()].join()}`);
        mapObject.forEach( (value,key) => {
            console.log(`Key ${key}, V:${value}`);
            beautyPrint += `${key} - ${value}` + "\n";
        });
        return beautyPrint;
    }
}