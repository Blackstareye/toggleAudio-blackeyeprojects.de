export default class Printer {

    static printBeautyObject(variantObject) {
        return JSON.stringify(variantObject, null, 2);
    }

    static printBeautyMap(mapObject) {
        let beautyPrint = "";
        for (const [key, value] of mapObject) {
            beautyPrint += `Device ${key} - ${value}` + "\n";
        }
        return beautyPrint;
    }
}