const axios = require('axios');
const fs = require('fs');

function getColumuIds(columns) {
    return {
        SECID : columns.indexOf('SECID'),
        SHORTNAME : columns.indexOf('SHORTNAME'),
        PREVPRICE : columns.indexOf('PREVPRICE'),
        COUPONVALUE : columns.indexOf('COUPONVALUE'),
        NEXTCOUPON : columns.indexOf('NEXTCOUPON'),
        ACCRUEDINT : columns.indexOf('ACCRUEDINT'),
        STATUS : columns.indexOf('STATUS'),
        MATDATE : columns.indexOf('MATDATE'),
        COUPONPERCENT : columns.indexOf('COUPONPERCENT'),
        COUPONPERIOD : columns.indexOf('COUPONPERIOD'),
        ISSUESIZE : columns.indexOf('ISSUESIZE'),
        ISSUESIZEPLACED : columns.indexOf('ISSUESIZEPLACED'),
        LOTVALUE : columns.indexOf('LOTVALUE'),
        OFFERDATE : columns.indexOf('OFFERDATE'),
    };
}

function getColumnsAsStr(columns, ids = []) {    
    let result = '';
    ids.forEach(i => {
        if(i && i >=0 && i < columns.length)
            result += columns[i] + ';';
    });
    return result;
}

function couponPerYear(cID, paper) {
    var c = paper[cID.COUPONVALUE];
    var p = paper[cID.COUPONPERIOD];
    return c * 365 / p;
}

function couponYieldPerYear(cID, paper) {
    var c = couponPerYear(cID, paper);
    var price = paper[cID.PREVPRICE];
    var lot = paper[cID.LOTVALUE];
    var p = lot * price / 100;
    return c / p * 100;
}

axios.get('https://iss.moex.com/iss/engines/stock/markets/bonds/securities.json')
.then(response => {
    const columns = response.data.securities.columns;
    const cID = getColumuIds(columns);
    // console.log(getColumnsAsStr(columns, [
    //     colID.SECID, 
    //     colID.SHORTNAME,
    //     colID.LOTVALUE,
    //     colID.PREVPRICE,
    //     colID.OFFERDATE,
    //     colID.COUPONVALUE,
    //     colID.ACCRUEDINT,
    //     colID.COUPONPERCENT,
    // ]));


    let filtered = response.data.securities.data.filter(x => {
        var price = x[cID.PREVPRICE];
        return price > 80 && price <= 102 && couponYieldPerYear(cID, x) > 10;
    });    

    // filtered.sort((x, y) => {
    //     var xName = x[cID.SHORTNAME];
    //     var yName = y[cID.SHORTNAME];
    //     if(xName > yName) return 1;
    //     if(xName < yName) return -1;
    //     return 0;
    // });
    
    filtered.sort((x, y) => {
        var a = x[cID.MATDATE];
        var b = y[cID.MATDATE];
        if(a > b) return 1;
        if(a < b) return -1;
        return 0;
    });

    filtered.forEach(x => {
        let str = `${x[cID.PREVPRICE]} | ${x[cID.SHORTNAME]} | ${x[cID.MATDATE]} | ${x[cID.NEXTCOUPON]} | ${couponYieldPerYear(cID, x).toFixed(2)} | ${x[cID.COUPONPERCENT]} | ${x[cID.COUPONPERIOD]}`;
        fs.appendFileSync('bonds.txt', str + '\r\n')
        console.log(str);
    });       
})
.catch(error => {
    console.log(error);
});