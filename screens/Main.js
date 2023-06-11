import * as Location from 'expo-location';
import { StatusBar } from "expo-status-bar";
import React, {useEffect, useState} from "react";
import { 
  View, 
  Text, Dimensions, 

  StyleSheet, ScrollView, TextInput, Button, Image, Share, ImageBackground } from 'react-native';

import {
  LineChart,
} from "react-native-chart-kit";

import * as SQLite from 'expo-sqlite';


// import axios from 'axios';

import { useNavigation } from '@react-navigation/native';
import {LinearGradient} from 'expo-linear-gradient';
import useCachedResources from "./useCachedResources";
//npx expo install expo-linear-gradient

// import * as SQLite from 'expo-sqlite';
// import * as FileSystem from 'expo-file-system';

// const db = SQLite.openDatabase('db.db');
// console.log(db);
// db.transaction(tx => {
//   tx.executeSql(
//     'CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, age INTEGER)'
//   );
//   tx.executeSql(
//     'INSERT INTO users (name, age) VALUES (?, ?)',
//     ['John Doe', 25]
//   );
// });

// db.transaction(tx => {
//   tx.executeSql(
//     'SELECT * FROM users',
//     [],
//     (_, { rows }) => {
//       for (let i = 0; i < rows.length; i++) {
//         console.log("????",rows.item(i));
//       }
//     }
//   );
// });

// const dataDirectory = FileSystem.documentDirectory;
// const databasePath = `${dataDirectory}db.db`;
// console.log(databasePath);

const chartHeight = Dimensions.get('window').height;
const chartWidth = Dimensions.get('window').width;


const {width:SCREEN_WIDTH} = Dimensions.get("window");
// console.log(SCREEN_WIDTH);

// api key
const serviceKey = 'DHAcdCIG92vecEcQDukq%2B%2Fn8eWJtPZ9jKZ3isc%2FWrsnaFK1ZMGLQraTGzmMhDIQLj%2FZCUSkvmj1BgKChWFkbjw%3D%3D';
const locationJson = require('../data.json');


// 초단기예보 : 현재 시각에서 1시간 빼줌 (예외처리 : 23시)
// 단기예보 : 어제 날짜, 23시로 지정
var modifyTime = function(hours,day,apiType) 
{
  if (hours == '00' || apiType=="vilage")
  {
    hours = '23';
    var now = new Date();
    day = now.getDate(now.setDate(now.getDate()-1)).toString().padStart(2,'0'); // 어제 날짜
  }
  else
  {
    hours = parseInt(hours)-1;
    hours=hours.toString().padStart(2,'0');
  }
  return [hours,day];
}

function modifyRegion(region){
  if (region.charAt(region.length - 1)=="시"){
    region=region.substr(0,2);
  }
  else if (region.charAt(region.length - 1)=="도"){
    console.log(region);
    switch (region){
      case "충청북도":
        region="충북";
        break;
      case "충청남도":
        region="충남";
        break;
      case "전라북도":
        region="전북";
        break;
      case "전라남도":
        region="전남";
        break;
      case "경상북도":
        region="경북";
        break;
      case "경상남도":
        region="경남";
        break;
      default:
        region=region.substr(0,2);
    }
  }
  return region;
}



// 위도, 경도 -> x,y 좌표
var RE = 6371.00877; // 지구 반경(km)
var GRID = 5.0; // 격자 간격(km)
var SLAT1 = 30.0; // 투영 위도1(degree)
var SLAT2 = 60.0; // 투영 위도2(degree)
var OLON = 126.0; // 기준점 경도(degree)
var OLAT = 38.0; // 기준점 위도(degree)
var XO = 43; // 기준점 X좌표(GRID)
var YO = 136; // 기준점 Y좌표(GRID)    

// LCC DFS 좌표변환 ( code : "toXY"(위경도->좌표, v1:위도, v2:경도), "toLL"(좌표->위경도,v1:x, v2:y) )
function dfs_xy_conv(code, v1, v2) {
    var DEGRAD = Math.PI / 180.0;
    var RADDEG = 180.0 / Math.PI;

    var re = RE / GRID;
    var slat1 = SLAT1 * DEGRAD;
    var slat2 = SLAT2 * DEGRAD;
    var olon = OLON * DEGRAD;
    var olat = OLAT * DEGRAD;

    var sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
    var sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sf = Math.pow(sf, sn) * Math.cos(slat1) / sn;
    var ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
    ro = re * sf / Math.pow(ro, sn);
    var rs = {};
    if (code == "toXY") {
        rs['lat'] = v1;
        rs['lng'] = v2;
        var ra = Math.tan(Math.PI * 0.25 + (v1) * DEGRAD * 0.5);
        ra = re * sf / Math.pow(ra, sn);
        var theta = v2 * DEGRAD - olon;
        if (theta > Math.PI) theta -= 2.0 * Math.PI;
        if (theta < -Math.PI) theta += 2.0 * Math.PI;
        theta *= sn;
        rs['x'] = Math.floor(ra * Math.sin(theta) + XO + 0.5);
        rs['y'] = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);
    }
    else {
        rs['x'] = v1;
        rs['y'] = v2;
        var xn = v1 - XO;
        var yn = ro - v2 + YO;
        ra = Math.sqrt(xn * xn + yn * yn);
        if (sn < 0.0) - ra;
        var alat = Math.pow((re * sf / ra), (1.0 / sn));
        alat = 2.0 * Math.atan(alat) - Math.PI * 0.5;

        if (Math.abs(xn) <= 0.0) {
            theta = 0.0;
        }
        else {
            if (Math.abs(yn) <= 0.0) {
                theta = Math.PI * 0.5;
                if (xn < 0.0) - theta;
            }
            else theta = Math.atan2(xn, yn);
        }
        var alon = theta / sn + olon;
        rs['lat'] = alat * RADDEG;
        rs['lng'] = alon * RADDEG;
    }
    return rs;
}

// 미세먼지 api : xml 파싱
function parseXml(xml) {
  var parseString=require('react-native-xml2js').parseString;
  return new Promise((resolve, reject) => {
    parseString(xml, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}


// 날씨(현재 시간) 예보 코드 -> 값
// 초단기예보 api
function extractUltraSrtWeather(json){
  const items = json.response.body.items.item;
  const currentTime=items[0]["fcstTime"]; // 현재 시간(hour)
  // console.log(currentTime);
  let weatherInfo = {}; 
  items.forEach((dic)=>{
    if (dic["fcstTime"]==currentTime){
      switch(dic["category"]){
        case "T1H": // 기온
          weatherInfo.temperature = dic["fcstValue"];
          break;
        case "SKY": // 하늘 상태
          weatherInfo.sky =dic["fcstValue"];
          break;
        case "WSD": // 풍속
          weatherInfo.wind = dic["fcstValue"];
          break;
        case "PTY": // 강수형태
          weatherInfo.rainOrsnow = dic["fcstValue"];
          break;
        case "RN1" : // 강수량
          weatherInfo.rainfall = dic["fcstValue"];
          break;
        case "REH" : // 습도
          weatherInfo.humidity=dic["fcstValue"];
          break;
      }
    }
  });
  return weatherInfo;
};

// 날씨(현재 시간) 예보 코드 -> 값
// 단기예보 api
export function extractVilageWeather(json){
  const items = json.response.body.items.item;
  let weatherInfo = {};
  let tmpfortime = {}; 
  let windfortime = {}; 
  let rainfortime = {};
  let humidityfortime = {};
  items.forEach((dic)=>{
    if (dic["category"]=='TMN'){ // 최저 기온
      weatherInfo.lowerTmp=dic["fcstValue"];
    }
    if (dic["category"]=='TMX'){ //최고 기온
      weatherInfo.upperTmp=dic["fcstValue"];
    }
    if (dic["category"]=='TMP'){
      switch (dic["fcstTime"]){
        case '0600':
          tmpfortime.tmp06=dic["fcstValue"];
          break;
        case '0900':
          tmpfortime.tmp09=dic["fcstValue"];
          break;
        case '1200':
          tmpfortime.tmp12=dic["fcstValue"];
          break;
        case '1500':
          tmpfortime.tmp15=dic["fcstValue"];
          break;
        case '1800':
          tmpfortime.tmp18=dic["fcstValue"];
          break;
        case '2100':
          tmpfortime.tmp21=dic["fcstValue"];
      }
    }
    if (dic["category"]=='WSD'){
      switch (dic["fcstTime"]){
        case '0600':
          windfortime.wind06=dic["fcstValue"];
          break;
        case '0900':
          windfortime.wind09=dic["fcstValue"];
          break;
        case '1200':
          windfortime.wind12=dic["fcstValue"];
          break;
        case '1500':
          windfortime.wind15=dic["fcstValue"];
          break;
        case '1800':
          windfortime.wind18=dic["fcstValue"];
          break;
        case '2100':
          windfortime.wind21=dic["fcstValue"];
      }
    }
    if (dic["category"]=='PCP'){
      if (dic["fcstValue"]=="강수없음"){
        dic["fcstValue"]="0.0mm"
      }
      switch (dic["fcstTime"]){
        case '0600':
          rainfortime.rain06=dic["fcstValue"];
          break;
        case '0900':
          rainfortime.rain09=dic["fcstValue"];
          break;
        case '1200':
          rainfortime.rain12=dic["fcstValue"];
          break;
        case '1500':
          rainfortime.rain15=dic["fcstValue"];
          break;
        case '1800':
          rainfortime.rain18=dic["fcstValue"];
          break;
        case '2100':
          rainfortime.rain21=dic["fcstValue"];
      }
    }
    if (dic["category"]=='REH'){
      switch (dic["fcstTime"]){
        case '0600':
          humidityfortime.humidity06=dic["fcstValue"];
          break;
        case '0900':
          humidityfortime.humidity09=dic["fcstValue"];
          break;
        case '1200':
          humidityfortime.humidity12=dic["fcstValue"];
          break;
        case '1500':
          humidityfortime.humidity15=dic["fcstValue"];
          break;
        case '1800':
          humidityfortime.humidity18=dic["fcstValue"];
          break;
        case '2100':
          humidityfortime.humidity21=dic["fcstValue"];
      }
    }
  });
  // console.log("강수량 데이터 확인:",rainfortime);
  return [weatherInfo, tmpfortime, windfortime, rainfortime, humidityfortime];
};

// 주간(내일, 모레) 최저, 최고 기온 추출
export function extractVilageWeekWeather(json){
  const items = json.response.body.items.item;
  let maximumTemp = [];
  let minimumTemp = [];
  items.forEach((dic)=>{
    if (dic["category"]=='TMN'){ // 최저 기온
      minimumTemp.push(dic["fcstValue"]);
    }
    if (dic["category"]=='TMX'){ //최고 기온
      maximumTemp.push(dic["fcstValue"]);
    }
  });
  // console.log("최저기온리스트 확인:",minimumTemp);
  // console.log("최고기온리스트 확인:",maximumTemp);
  return [minimumTemp, maximumTemp];
};

// 주간(3일 후~9일 후) 최저, 최고 기온 추출
export function extractVilageWeekWeather3(json){
  const item = json.response.body.items.item[0];
  let maximumTemp = [];
  let minimumTemp = [];

  for (let i = 3; i <= 10; i++) {
    const taMinKey = `taMin${i}`;
    const taMaxKey = `taMax${i}`;
    const taMinValue = item[taMinKey];
    const taMaxValue = item[taMaxKey];
  
    minimumTemp.push(taMinValue);
    maximumTemp.push(taMaxValue);
  
  }
  return [minimumTemp, maximumTemp];
};


function extractPm(grade){
  if (grade==1){
    return "좋음";
  }
  else if (grade==2){
    return "보통";
  }
  else if (grade==3){
    return "나쁨";
  }
  else if (grade==4){
    return "매우나쁨";
  }
}

export function commentWeather(weatherDict,apiType){
  let commentDict={};
  if (apiType=="ultraSrt"){
    commentDict.temperature=weatherDict.temperature+"℃";
    commentDict.wind=weatherDict.wind+"m/s";
    if (weatherDict.rainfall == "강수없음"){
      commentDict.rainfall=weatherDict.rainfall;
    }
    else{
      commentDict.rainfall=weatherDict.rainfall+"mm";
    }
    
    switch(weatherDict.sky){
      case "1":
        commentDict.sky="맑음";
        break;
      case "3":
        commentDict.sky="구름많음";
        break;
      case "4":
        commentDict.sky="흐림";
        break;
    }
    switch(weatherDict.rainOrsnow){
      case "0":
        commentDict.rainOrsnow="없음";
        break;
      case "1":
        commentDict.rainOrsnow="비";
        break;
      case "2":
        commentDict.rainOrsnow="비/눈";
        break;
      case "3":
        commentDict.rainOrsnow="눈";
        break;
      case "5":
        commentDict.rainOrsnow="빗방울";
        break;
      case "6":
        commentDict.rainOrsnow="빗방울눈날림";
        break;
      case "7":
        commentDict.rainOrsnow="눈날림";
        break;
    }   
  }
  return commentDict; 
}

export function getDayofweek(){

  var d = new Date();
  var weekday = new Array(7);
  weekday[0] = "일요일";
  weekday[1] = "월요일";
  weekday[2] = "화요일";
  weekday[3] = "수요일";
  weekday[4] = "목요일";
  weekday[5] = "금요일";
  weekday[6] = "토요일";

  today=d.getDay() // 1
  var weekly=[];

  for(let i=0 ; i<7 ; i++){
    if (today==7){
      today=0;
    }
    weekly.push(weekday[today]);
    today+=1;
    // console.log(weekly);
  }
  return weekly;
}


const toDay = new Date();

const month = (toDay.getMonth() + 1).toString();
const day = toDay.getDate().toString().padStart(2, '0');
const d = toDay.getDay();
const week = getDayofweek();
const dayYo = week[d];
console.log("오늘", dayYo);


// 초단기예보, 단기예보 api
function getCurrnetWeatherUrl(latitude, longitude, apiType){
  // const numOfRows = 60;
  // const pageNo = 1;

  // Get the current date and time
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
  var day = currentDate.getDate().toString().padStart(2, '0');
  var hours = currentDate.getHours().toString().padStart(2, '0');
  var minutes = currentDate.getMinutes().toString().padStart(2, '0');

  const base_date2 = `${year}${month}${day}`;

  var modifiedTime;
  if (apiType=="vilage"){
    modifiedTime = modifyTime(hours,day,"vilage");
  }
  else if (apiType=="ultraSrt"){
    modifiedTime = modifyTime(hours,day,"ultraSrt");
  }
  
  hours=modifiedTime[0];
  day=modifiedTime[1];

  var base_date = `${year}${month}${day}`;
  
  const base_time = `${hours}${minutes}`;

  var rs = dfs_xy_conv("toXY",latitude.toString(),longitude.toString());
  // console.log("x,y 확인",rs.x, rs.y);
  const nx = rs.x;
  const ny = rs.y;
  
  return [`http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst?serviceKey=${serviceKey}&numOfRows=60&pageNo=1&base_date=${base_date}&base_time=${base_time}&nx=${nx}&ny=${ny}&dataType=json`,
          `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=${serviceKey}&numOfRows=290&pageNo=1&base_date=${base_date}&base_time=2300&nx=${nx}&ny=${ny}&dataType=json`,
          `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=${serviceKey}&numOfRows=882&pageNo=1&base_date=${base_date}&base_time=2300&nx=${nx}&ny=${ny}&dataType=json`,
          `https://apis.data.go.kr/1360000/MidFcstInfoService/getMidTa?serviceKey=${serviceKey}&pageNo=1&numOfRows=10&dataType=JSON&regId=11G00201&tmFc=${base_date2}0600`];
}

function getCurrnetPmUrl(region){
  region=modifyRegion(region);
  const encodedRegion = encodeURIComponent(region);
  return `http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty?serviceKey=${serviceKey}&numOfRows=125&pageNo=1&sidoName=${encodedRegion}&ver=1.0`;
}

export function sensoryTemp(temp,humidity){
  // console.log("기온,습도",temp,humidity);
  let Tw=temp*Math.atan(0.151977*Math.sqrt(humidity+8.313659)); //Tw(습구온도)
  Tw += Math.atan(temp+humidity);
  Tw -= Math.atan(humidity-1.67633);
  Tw += (0.00391838*Math.pow(humidity,1.5) * Math.atan(0.023101*humidity));
  Tw -= 4.686035;
  // Math.round(Number * 10^n) / 10^n
  let result=Math.round((-0.2442 + (0.55399*Tw) + (0.45535*temp) - (0.0022*Math.pow(Tw,2)) + (0.00278*Tw*temp) + 3.0) * 10 ) / 10; // 체감온도
  return result;
}



// var data = {
//   labels: ["6시", "9시", "12시", "15시", "18시", "21시"],
//   datasets : [
//     {
//       data: [10, 10, 10, 10, 10, 10],
//       color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`, // 첫 번째 데이터 세트의 색상
//       strokeWidth: 2 // 첫 번째 데이터 세트의 선 두께
//     },
//     {
//       data: [10, 35, 18, 70, 89, 33],
//       color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`, // 두 번째 데이터 세트의 색상
//       strokeWidth: 2 // 두 번째 데이터 세트의 선 두께
//     }
//   ],
//   legend: ["시간대별 기온 비교"] // optional
// };

export function makeData(currentTmpForTime){
  const values = [];
  Object.values(currentTmpForTime).forEach(value => {
    values.push(parseInt(value));
  });
  // console.log(values);
  // console.log("makeData 확인",typeof(values[0]));
  return values;
}

export function makeSensoryData(tmpList,humidityList){
  const values = [];
  for(let i=0 ; i<tmpList.length ; i++){
    values.push(sensoryTemp(tmpList[i],humidityList[i]))
  }
  // console.log(values);
  // console.log("makeData 확인",typeof(values[0]));
  return values;
}


const {width:screenWidth} = Dimensions.get("window");

const chartConfig = {
  backgroundGradientFrom: "#1E2923",
  backgroundGradientFromOpacity: 0,
  backgroundGradientTo: "#08130D",
  backgroundGradientToOpacity: 0.5,
  color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
  strokeWidth: 2, // optional, default 3
  barPercentage: 0.5,
  useShadowColorFromDataset: false // optional
};


export async function setPm(pmResponse){
  try {
    var parseResult = await parseXml(pmResponse);
    var pmGradeSum10=0; // 미세먼지 등급
    var pmGradeSum25 = 0; // 초미세먼지 등급
    var pmValueSum10=0; // 미세먼지 농도
    var pmValueSum25=0; // 초미세먼지 농도
    var countGrade10=0;
    var countGrade25 = 0;
    var countValue10=0;
    var countValue25=0;
    const items = parseResult.response.body[0].items[0].item;
    for (const item of items) {
      const pm10Grade = parseInt(item.pm10Grade[0]);
      const pm25Grade = parseInt(item.pm25Grade[0]);
      const pm10Value = parseInt(item.pm10Value[0]);
      const pm25Value = parseInt(item.pm25Value[0]);
      if (!isNaN(pm10Grade)) {
        pmGradeSum10 += pm10Grade;
        countGrade10 += 1;
      }
      if (!isNaN(pm25Grade)) {
        pmGradeSum25 += pm25Grade;
        countGrade25 += 1;
      }
      if (!isNaN(pm10Value)) {
        pmValueSum10 += pm10Value;
        countValue10 += 1;
      }
      if (!isNaN(pm25Value)) {
        pmValueSum25 += pm25Value;
        countValue25 += 1;
      }
      // console.log("pm10Grade:", pm10Grade);
    }
    grade10=extractPm(Math.round(pmGradeSum10 / countGrade10))
    grade25=extractPm(Math.round(pmGradeSum25 / countGrade25))
    value10=Math.round(pmValueSum10 / countValue10)
    value25=Math.round(pmValueSum25 / countValue25)
    console.log("pm 성공");
    return [grade10, grade25, value10, value25];
    // setPmGrade10(extractPm(Math.round(pmGradeSum10 / countGrade10)));
    // setPmGrade25(extractPm(Math.round(pmGradeSum25 / countGrade25)));
    // setPmValue10(Math.round(pmValueSum10 / countValue10));
    // setPmValue25(Math.round(pmValueSum25 / countValue25));
    //console.log("미세먼지 농도: ",pmValue10);
  } catch (err) {
    console.log("Error:", err); // console에 'Error: [TypeError: Cannot read property 'body' of undefined]' 이렇게 떠도 앱에는 잘 출력됨(왜..?)
    return 0;
  }
}


export default function Main() {
  // deer 이미지
  const hot_deer = require('./src/assets/image/Deer.png');
  const cold_deer = require('./src/assets/image/cold_deer.png');
  const normal_deer = require('./src/assets/image/nomal_deer.png');
  const rain_deer = require('./src/assets/image/rain_deer.png');
  const wind_deer = require('./src/assets/image/wind_deer.png');
  const [deerImg, setDeerImg]=useState();

  // 배경색
  const [backLiner, setBackLiner] = useState();

  //미세먼지 배경색
  const [dustbackLiner, setDustbackLiner] = useState();

  // 미세먼지 이미지

  const dustcloud = require('./src/assets/image/weather-icon/dust.png');
  const cleancloud = require('./src/assets/image/weather-icon/clean.png');

  const [cloudImg, setCloudImg]=useState();

  const [city, setCity]=useState("Loading...");
  const [subregion, setSubregion]=useState();
  const [district, setDistrict]=useState();
  const [TEMP, setTemp]=useState();
  const [SKY, setSky]=useState();
  const [wind, setWind]=useState();
  const [rainfall, setRainfall]=useState();
  // const [humidity, setHumidity]=useState();
  const [sensoryTEMP, setSensoryTemp]=useState();
  const [lowerTEMP, setLowerTemp]=useState();
  const [upperTEMP, setUpperTemp]=useState();
  const [pmGrade10, setPmGrade10]=useState();
  const [pmGrade25, setPmGrade25]=useState();
  const [pmValue10, setPmValue10]=useState();
  const [pmValue25, setPmValue25]=useState();

  const [tempData, setTempData]=useState(null);
  const [windData, setWindData]=useState(null);
  const [rainData, setRainData]=useState(null);
  const [sensoryData, setSensoryData]=useState(null);
  
  const [vilageJson, setVilageJson]=useState();
  const [isLoading, setIsLoading] = useState(true);
  
  // 검색 기능을 위한.
  const [locationName, setLocationName] = useState("");
  const [searchLatitude, setLatitude] = useState('');
  const [searchLongitude, setLongitude] = useState('');

  // 즐겨찾기 기능

  const [favorite1, setFavorite1] = useState("");
  const [favorite2, setFavorite2] = useState("");
  const [favorite3, setFavorite3] = useState("");



  // 주간 최저/최고 기온
  const [tomorrowMin, setTomorrowMin] = useState();
  const [afterTomorrowMin, setAfterTomorrowMin] = useState();
  const [tomorrowMax, setTomorrowMax] = useState();
  const [afterTomorrowMax, setAfterTomorrowMax] = useState();
  const [min3, setMin3] = useState();
  const [max3, setMax3] = useState();
  const [min4, setMin4] = useState();
  const [max4, setMax4] = useState();
  const [min5, setMin5] = useState();
  const [max5, setMax5] = useState();
  const [min6, setMin6] = useState();
  const [max6, setMax6] = useState();
  

  // const [toDay, setToDay] = useState(); 

  const [dayofweek3, setDayofweek3] = useState(); 
  const [dayofweek4, setDayofweek4] = useState(); 
  const [dayofweek5, setDayofweek5] = useState(); 
  const [dayofweek6, setDayofweek6] = useState(); 

  const isLoaded = useCachedResources();

  const navigation = useNavigation();

  const [advice, setAdvice]=useState();

  const [shareTwo, setShareTwo] = useState();
  
  // const [location, setLocation] = useState();
  // const [days, setDays]=useState([]);
  const [ok, setOk] = useState(true);

  // 이미지 동적 변경을 위한
  const [isWeatherLoaded, setIsWeatherLoaded] = useState(false);

  
  const db = SQLite.openDatabase('weather.db');

  // 검색 기능
  async function searchLocation() {
    const result = locationJson.find(item => item['3단계'] === locationName);
    const loc=locationName;

    if (result) {
      const { '위도(초/100)': lat, '경도(초/100)': lon } = result;
      const { '1단계' : sido } = result;
      setLatitude(lat);
      setLongitude(lon);
      sidoForPm=modifyRegion(sido);
      
      // 

      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM bookmarkloc WHERE loc = ?',
          [locationName],
          (_, { rows }) => {
            if (rows.length === 0) { // 테이블에 해당 위치가 저장되어 있지 않을 경우
              tx.executeSql(
                'INSERT INTO bookmarkloc (loc) VALUES (?)', // 위치 insert
                [locationName],
                (_, { rowsAffected }) => {
                  if (rowsAffected > 0) {
                    console.log('Location inserted successfully.');
                  } else {
                    console.log('Failed to insert location.');
                  }
      
                  // 두 번째 쿼리 실행. 순서 보장하기 위해 콜백 함수 내에서 처리
                  tx.executeSql(
                    'SELECT * FROM bookmarkloc ORDER BY id DESC LIMIT 3', // 최근에 추가된 값 3개 내림차순으로 가져와서 즐겨찾기 목록에 추가
                    [],
                    (_, { rows }) => {
                      if (rows.length >= 1) {
                        setFavorite1(rows.item(0).loc);
                      }
                      if (rows.length >= 2) {
                        setFavorite2(rows.item(1).loc);
                      }
                      if (rows.length >= 3) {
                        setFavorite3(rows.item(2).loc);
                      }
                    }
                  );
                }
              );
            } else {
              console.log('Location already exists.');
              // 검색한 지역이 table에 이미 있을 경우 삭제한 뒤 다시 새롭게 추가
              tx.executeSql(
                'DELETE FROM bookmarkloc WHERE loc = ?',
                [locationName],
                (_, { rowsAffected }) => {
                  if (rowsAffected > 0) {
                    console.log('Location deleted successfully.');
                    tx.executeSql(
                      'INSERT INTO bookmarkloc (loc) VALUES (?)',
                      [locationName],
                      (_, { rowsAffected }) => {
                        if (rowsAffected > 0) {
                          console.log('Location inserted successfully.');
                        } else {
                          console.log('Failed to insert location.');
                        }
      
                        // INSERT 이후에 두 번째 쿼리 실행
                        tx.executeSql(
                          'SELECT * FROM bookmarkloc ORDER BY id DESC LIMIT 3',
                          [],
                          (_, { rows }) => {
                            if (rows.length >= 1) {
                              setFavorite1(rows.item(0).loc);
                            }
                            if (rows.length >= 2) {
                              setFavorite2(rows.item(1).loc);
                            }
                            if (rows.length >= 3) {
                              setFavorite3(rows.item(2).loc);
                            }
                          }
                        );
                      }
                    );
                  } else {
                    console.log('Failed to delete location.');
                  }
                }
              );
            }
          }
        );
      });



        
   
      

      // 검색 지역 초단기 api 요청
      const srcUltraSrtUrl = getCurrnetWeatherUrl(lat, lon, "ultraSrt")[0];
      // console.log("검색 지역 초단기 url",srcUltraSrtUrl)
      const srcUltraSrtResponse = await fetch(srcUltraSrtUrl);
      const srcUltraSrtJson = await srcUltraSrtResponse.json();
      //const searchUrl = extractUltraSrtWeather(searchUrl5);
      const srcUltraSrtInfo=extractUltraSrtWeather(srcUltraSrtJson);
      //const searchUrl = JSON.stringify(searchUrl3)

      // 검색 지역 단기 api 요청
      const srcVilageUrl = getCurrnetWeatherUrl(lat, lon,"vilage")[1];
      // console.log("검색 지역 단기 url",srcVilageUrl);
      const srcVilageResponse = await fetch(srcVilageUrl);
      const srcVilageJson = await srcVilageResponse.json(); // 응답을 JSON 형태로 파싱
      const srcVilageInfo=extractVilageWeather(srcVilageJson)[0];
      const searchTmpForTime=extractVilageWeather(srcVilageJson)[1];
      const searchWindForTime=extractVilageWeather(srcVilageJson)[2];
      const searchRainForTime=extractVilageWeather(srcVilageJson)[3];
      const searchHumidityForTime=extractVilageWeather(srcVilageJson)[4];

      // 검색 지역 미세먼지 api 요청
      const srcPmUrl = getCurrnetPmUrl(sidoForPm);
      // console.log("검색 지역 pmurl : ",srcPmUrl);
      var srcPmResponse = await fetch(srcPmUrl);
      srcPmResponse=await srcPmResponse.text();
      srcPmlist=await setPm(srcPmResponse);
      


      navigation.navigate('Search', { srcUltraSrtInfo : srcUltraSrtInfo, srcVilageInfo : srcVilageInfo,
                                      searchTmpForTime : searchTmpForTime, searchWindForTime : searchWindForTime,
                                      searchRainForTime : searchRainForTime, searchHumidityForTime : searchHumidityForTime,
                                      vilageJson : vilageJson, srcPmlist : srcPmlist,
                                      district : district, loc : loc });

      // console.log("검색 지역 urllll", srcUltraSrtInfo);
    } else {
      setLatitude('');
      setLongitude('');
    }
  };

   // 검색 기능 for 즐겨찾기
   async function searchLocationbk(loc) {

    const result = locationJson.find(item => item['3단계'] === loc);

    if (result) {
      const { '위도(초/100)': lat, '경도(초/100)': lon } = result;
      const { '1단계' : sido } = result;
      setLatitude(lat);
      setLongitude(lon);
      sidoForPm=modifyRegion(sido);
      

      // const db = SQLite.openDatabase('weather.db');


      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM bookmarkloc WHERE loc = ?',
          [locationName],
          (_, { rows }) => {

            if (rows.length === 0) {
              tx.executeSql(
                'INSERT INTO bookmarkloc (loc) VALUES (?)',

                [locationName],
                (_, { rowsAffected }) => {
                  if (rowsAffected > 0) {
                    console.log('Location inserted successfully.');
                  } else {
                    console.log('Failed to insert location.');
                  }
      

                  // 두 번째 쿼리 실행. 순서 보장하기 위해 콜백 함수 내에서 처리
                  tx.executeSql(
                    'SELECT * FROM bookmarkloc ORDER BY id DESC LIMIT 3', // 최근에 추가된 값 3개 내림차순으로 가져와서 즐겨찾기 목록에 추가
                    [],
                    (_, { rows }) => {
                      if (rows.length >= 1) {
                        setFavorite1(rows.item(0).loc);
                      }
                      if (rows.length >= 2) {
                        setFavorite2(rows.item(1).loc);
                      }
                      if (rows.length >= 3) {
                        setFavorite3(rows.item(2).loc);
                      }
                    }
                  );
                }
              );
            } else {
              console.log('Location already exists.');

      
              // 두 번째 쿼리 실행
              tx.executeSql(
                'SELECT * FROM bookmarkloc ORDER BY id DESC LIMIT 3',
                [],
                (_, { rows }) => {
                  if (rows.length >= 1) {
                    setFavorite1(rows.item(0).loc);
                  }
                  if (rows.length >= 2) {
                    setFavorite2(rows.item(1).loc);
                  }
                  if (rows.length >= 3) {
                    setFavorite3(rows.item(2).loc);
                  }
                }
              );
              tx.executeSql(
                'SELECT * FROM bookmarkloc',
                [],
                (_, { rows }) => {
                  for (let i = 0; i < rows.length; i++) {
                    // console.log(rows.item(i).loc);
                  }
                }
              );
            }
          }
        );
      });

      

      // 검색 지역 초단기 api 요청
      const srcUltraSrtUrl = getCurrnetWeatherUrl(lat, lon, "ultraSrt")[0];
      // console.log("검색 지역 초단기 url",srcUltraSrtUrl)
      const srcUltraSrtResponse = await fetch(srcUltraSrtUrl);
      const srcUltraSrtJson = await srcUltraSrtResponse.json();
      //const searchUrl = extractUltraSrtWeather(searchUrl5);
      const srcUltraSrtInfo=extractUltraSrtWeather(srcUltraSrtJson);
      //const searchUrl = JSON.stringify(searchUrl3)

      // 검색 지역 단기 api 요청
      const srcVilageUrl = getCurrnetWeatherUrl(lat, lon,"vilage")[1];
      // console.log("검색 지역 단기 url",srcVilageUrl);
      const srcVilageResponse = await fetch(srcVilageUrl);
      const srcVilageJson = await srcVilageResponse.json(); // 응답을 JSON 형태로 파싱
      const srcVilageInfo=extractVilageWeather(srcVilageJson)[0];
      const searchTmpForTime=extractVilageWeather(srcVilageJson)[1];
      const searchWindForTime=extractVilageWeather(srcVilageJson)[2];
      const searchRainForTime=extractVilageWeather(srcVilageJson)[3];
      const searchHumidityForTime=extractVilageWeather(srcVilageJson)[4];

      // 검색 지역 미세먼지 api 요청
      const srcPmUrl = getCurrnetPmUrl(sidoForPm);
      // console.log("검색 지역 pmurl : ",srcPmUrl);
      var srcPmResponse = await fetch(srcPmUrl);
      srcPmResponse=await srcPmResponse.text();
      srcPmlist=await setPm(srcPmResponse);
      


      navigation.navigate('Search', { srcUltraSrtInfo : srcUltraSrtInfo, srcVilageInfo : srcVilageInfo,
                                      searchTmpForTime : searchTmpForTime, searchWindForTime : searchWindForTime,
                                      searchRainForTime : searchRainForTime, searchHumidityForTime : searchHumidityForTime,
                                      vilageJson : vilageJson, srcPmlist : srcPmlist,
                                      district : district, loc : loc });

      // console.log("검색 지역 urllll", srcUltraSrtInfo);
    } else {
      setLatitude('');
      setLongitude('');
    }
  };
  
  // 현재(위치, 시간) 날씨
  const getWeather = async () => {
    // 승인 요청
    const {granted} = await Location.requestForegroundPermissionsAsync();
    if(!granted){
      setOk(false);
    }
    // 위도, 경도
    const {coords:{latitude, longitude}} = await Location.getCurrentPositionAsync({accuracy:5});
    

    const location = await Location.reverseGeocodeAsync(
      {latitude,longitude}, 
      {useGoogleMaps:false}
    );
    // console.log(location);
    var region=location[0].region; // 미세먼지 api 요청을 위한 변수. ex) 제주특별자치도, 경기도 ... 
    setCity(location[0].city); // ex) 제주시
    setDistrict(location[0].district); // ex) 일도이동
    setSubregion(location[0].subregion); // ex) 봉화군


    // 초단기 예보 api url
    const ultraSrtUrl = await getCurrnetWeatherUrl(latitude, longitude,"ultraSrt")[0];
    // console.log("초단기예보api url",ultraSrtUrl);
    
    const ultraSrtResponse = await fetch(ultraSrtUrl);
    const ultraSrtjson = await ultraSrtResponse.json(); // 응답을 JSON 형태로 파싱
    // console.log("checkkkkkkkk :", typeof(ultraSrtjson));
    ultraSrtWeatherInfo= extractUltraSrtWeather(ultraSrtjson);
    // setHumidity(ultraSrtWeatherInfo.humidity);
    setSensoryTemp(sensoryTemp(parseFloat(ultraSrtWeatherInfo.temperature),parseFloat(ultraSrtWeatherInfo.humidity))); // 체감온도
    setRainfall(ultraSrtWeatherInfo.rainfall); // 강수량
    // console.log("초단기 예보 : ",commentWeather(ultraSrtWeatherInfo,"ultraSrt"));
    // JSON.stringify() : 객체를 직접적으로 React 자식 요소로 사용할 수 없기 때문에 객체를 문자열로 변환
    // .replace(/\"/gi, "") : 따옴표 제거
    setTemp(JSON.stringify(commentWeather(ultraSrtWeatherInfo,"ultraSrt").temperature).replace(/\"/gi, "")); // 기온
    setSky(JSON.stringify(commentWeather(ultraSrtWeatherInfo,"ultraSrt").sky).replace(/\"/gi, "")); // 하늘 상태
    setWind(JSON.stringify(commentWeather(ultraSrtWeatherInfo,"ultraSrt").wind).replace(/\"/gi, "")); // 풍속
    
    
    console.log("**************",typeof(rainfall));
    console.log("+++++++++",parseInt(TEMP));
    // if (rainfall!="강수없음"){
    //   setDeerImg(rain_deer);
    // }
    // else{
    //   if (parseInt(TEMP)>20){
    //     setDeerImg(hot_deer);
    //   }
    //   else{
    //     setDeerImg(normal_deer);
    //   }
    // }
  
    
    
    
    

    // 단기 예보 api url
    const vilageUrl = getCurrnetWeatherUrl(latitude, longitude,"vilage")[1];
    console.log("단기예보 url",vilageUrl);
    const vilageResponse = await fetch(vilageUrl);
    const vilageJson = await vilageResponse.json(); // 응답을 JSON 형태로 파싱
    setVilageJson(vilageJson);
    // console.log("json1:",vilageJson);
    vilageWeatherInfo=extractVilageWeather(vilageJson)[0];
    

    // console.log("단기 예보 check : ",(vilageWeatherInfo));

    setLowerTemp(JSON.stringify(vilageWeatherInfo.lowerTmp).replace(/\"/gi, ""));
    setUpperTemp(JSON.stringify(vilageWeatherInfo.upperTmp).replace(/\"/gi, ""));

    
    // 미세먼지 api url
    const pmUrl = getCurrnetPmUrl(region);
    console.log("###############",pmUrl);
    var pmResponse = await fetch(pmUrl);
    pmResponse=await pmResponse.text();
    pmlist=await setPm(pmResponse);
    setPmGrade10(pmlist[0]);
    setPmGrade25(pmlist[1]);
    setPmValue10(pmlist[2]);
    setPmValue25(pmlist[3]);

    setIsWeatherLoaded(true);


    // 오늘, 내일, 모레 최저/최고 기온
    const vilageWeekUrl = getCurrnetWeatherUrl(latitude, longitude,"vilage")[2];
    // console.log("주간 예보 url",vilageWeekUrl);
    const vilageWeekResponse = await fetch(vilageWeekUrl);
    const vilageWeekJson = await vilageWeekResponse.json(); // 응답을 JSON 형태로 파싱
    weekMinTempList=extractVilageWeekWeather(vilageWeekJson)[0] // 최저기온 리스트
    weekMaxTempList=extractVilageWeekWeather(vilageWeekJson)[1] // 최고기온 리스트

    setTomorrowMin(weekMinTempList[0].replace(/\"/gi, "")); // 내일
    setAfterTomorrowMin(weekMinTempList[1].replace(/\"/gi, "")); // 모레
    setTomorrowMax(weekMaxTempList[0].replace(/\"/gi, ""));
    setAfterTomorrowMax(weekMaxTempList[1].replace(/\"/gi, ""));

    // 3일 후~ 9일 후 최저/최고 기온
    const vilageWeekUrl3 = getCurrnetWeatherUrl(latitude, longitude,"vilage")[3];
    console.log("이거",vilageWeekUrl3);
    const vilageWeekResponse3 = await fetch(vilageWeekUrl3);
    const vilageWeekJson3 = await vilageWeekResponse3.json(); // 응답을 JSON 형태로 파싱
    weekMinTempList3=extractVilageWeekWeather3(vilageWeekJson3)[0] // 최저기온 리스트
    weekMaxTempList3=extractVilageWeekWeather3(vilageWeekJson3)[1] // 최고기온 리스트
    

    setMin3(weekMinTempList3[0]); // 3일 뒤
    setMax3(weekMaxTempList3[0]);
    setMin4(weekMinTempList3[1]); // 4일 뒤
    setMax4(weekMaxTempList3[1]);
    setMin5(weekMinTempList3[2]); // 5일 뒤
    setMax5(weekMaxTempList3[2]);
    setMin6(weekMinTempList3[3]); // 6일 뒤
    setMax6(weekMaxTempList3[3]);

    const weekly=getDayofweek()
    console.log("!!!!!!!!!!!!!!!!!",weekly);

    // setToDay(weekly[0]);

    setDayofweek3(weekly[3]);
    setDayofweek4(weekly[4]);
    setDayofweek5(weekly[5]);
    setDayofweek6(weekly[6]);
    console.log(dayofweek3);

    
    

  };

  const compareWeather = async () => {

    // getWeather에서 생성한 vilageJson 사용
    // 6,9,12,15,18,21시 기온
    currentTmpForTime=extractVilageWeather(vilageJson)[1]; 
    const currentTmpList=makeData(currentTmpForTime);
    //console.log("검색 지역 기온 : ", searchTmpForTime);

    // 6,9,12,15,18,21시 풍속
    currentWindForTime=extractVilageWeather(vilageJson)[2]; 

    // 6,9,12,15,18,21시 강수량
    currentRainForTime=extractVilageWeather(vilageJson)[3];
    

    // 6,9,12,15,18,21시 습도
    currentHumidityForTime=extractVilageWeather(vilageJson)[4];

    const currentHumidityList=makeData(currentHumidityForTime);

    // 6,9,12,15,18,21시 체감온도
    const currentSensoryData = makeSensoryData(currentTmpList,currentHumidityList);
    
  
    

    const dataForTmp = {
      labels: ["6시", "9시", "12시", "15시", "18시", "21시"],
      datasets : [
        {
          data: makeData(currentTmpForTime),
          color: (opacity = 1) => `rgba(30, 50, 120, ${opacity})`, // 첫 번째 데이터 세트의 색상
          strokeWidth: 2 // 첫 번째 데이터 세트의 선 두께
        }
      ],

      //legend: ["시간대별 기온"] // optional

    };

    const dataForWind = {
      labels: ["6시", "9시", "12시", "15시", "18시", "21시"],
      datasets : [
        {
          data: makeData(currentWindForTime),
          color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`, // 첫 번째 데이터 세트의 색상
          strokeWidth: 2 // 첫 번째 데이터 세트의 선 두께
        }
      ],
      legend: ["시간대별 풍속"] // optional
    };

    const dataForRain = {
      labels: ["6시", "9시", "12시", "15시", "18시", "21시"],
      datasets : [
        {
          data: makeData(currentRainForTime),
          color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`, // 첫 번째 데이터 세트의 색상
          strokeWidth: 2 // 첫 번째 데이터 세트의 선 두께
        }
      ],
      legend: ["시간대별 강수량"] // optional
    };

    const dataForSensory = {
      labels: ["6시", "9시", "12시", "15시", "18시", "21시"],
      datasets : [
        {
          data: currentSensoryData,
          color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`, // 첫 번째 데이터 세트의 색상
          strokeWidth: 2 // 첫 번째 데이터 세트의 선 두께
        }
      ],
      legend: ["시간대별 체감온도"] // optional
    };

    // console.log("data 확인",data.datasets[0].data);
    setTempData(dataForTmp);
    setWindData(dataForWind);
    setRainData(dataForRain);
    setSensoryData(dataForSensory);
    setIsLoading(false); // 데이터 로딩 완료 상태 설정
    console.log("비교 그래프 확인")

  
  };





   const getAdvice = async (content,type) => {
    //gpt api_key

    // const api_key = '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';
    const api_key = '';

    const messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: content },
    ];
    // console.log({TEMP});
    const config = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        temperature: 0.5,
        n: 1,
        messages: messages,
      }),
    };

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', config);
      const data = await response.json();
      const choices = await data.choices;
      if(choices){
        let resultText = '';
        choices.forEach((choice, index) => {
        resultText += `${choice.message.content}\n`;
        });
        console.log(resultText);
        switch (type){
          case "current":
            setAdvice(resultText);
            break;
          case "shareTwo":
            setShareTwo(resultText);
            break;
        }
      }
      else{
        console.log('선택사항이 없습니다.');
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getWeather();
    compareWeather();

    
    if (TEMP !== undefined && pmGrade10 !== undefined) {
      // 현재 날씨 조언 기능
      getAdvice('기온' + TEMP + '도, 미세먼지 ' + pmGrade10 + '인 날씨에 대한 재밌는 한마디 부탁해', "current");
      // 공유 메시지 질문을 gpt에게 넘기기
      getAdvice('기온' + TEMP + '도, 미세먼지 ' + pmGrade10 + '인 날씨에 대한 메시지를 소중한 사람에게 보낼 거야. 메시지는 *을 사용해서 감싸줘.', "shareTwo");
    }

  }, [TEMP, pmGrade10]);

  // rainfall과 TEMP의 값이 변경되었을 때에만 setDeerImg() 함수 호출되도록 함
  // 기후별 배경색 변경
  useEffect(() => {
    if (rainfall !== "강수없음") {
      setDeerImg(rain_deer);
      setBackLiner('#4c5c7c');
    } else if (parseInt(wind) > 7) {
      setDeerImg(wind_deer);
      setBackLiner('#26a69a');
    } else {
      if (parseInt(TEMP) > 19) {
        setDeerImg(hot_deer);
        setBackLiner('#2980B9'); // #2980B9
      } else if (parseInt(TEMP) > 9){
        setDeerImg(normal_deer);
        setBackLiner('#f97a92');
      } else {
        setDeerImg(cold_deer);
        setBackLiner('#ffcdd2');
      }
    }
  }, [rainfall, TEMP, wind]);

  useEffect(() => {
    if (pmGrade10 == "좋음" || pmGrade10 == "보통"){
      setCloudImg(cleancloud);
      setDustbackLiner('#82b1ff');
    }
    else{
      setCloudImg(dustcloud);
      setDustbackLiner('#ffd180');
    }
    
  }, [pmGrade10]);

  useEffect(() => {
    const db = SQLite.openDatabase('weather.db');
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM bookmarkloc ORDER BY id DESC LIMIT 3',
        [],
        (_, { rows }) => {
          if (rows.length >= 1) {
            setFavorite1(rows.item(0).loc);
          }
          if (rows.length >= 2) {
            setFavorite2(rows.item(1).loc);
          }
          if (rows.length >= 3) {
            setFavorite3(rows.item(2).loc);
          }
        }
      );
    })
  }, []);



  // rainfall과 TEMP의 값이 변경되었을 때에만 setDeerImg() 함수 호출되도록 함
  // 기후별 배경색 변경
  useEffect(() => {
    if (rainfall !== "강수없음") {
      setDeerImg(rain_deer);
      setBackLiner('#4c5c7c');
    } else if (parseInt(wind) > 7) {
      setDeerImg(wind_deer);
      setBackLiner('#26a69a');
    } else {
      if (parseInt(TEMP) > 19) {
        setDeerImg(hot_deer);
        setBackLiner('#2980B9'); // #2980B9
      } else if (parseInt(TEMP) > 9){
        setDeerImg(normal_deer);
        setBackLiner('#f97a92');
      } else {
        setDeerImg(cold_deer);
        setBackLiner('#ffcdd2');
      }
    }
  }, [rainfall, TEMP, wind]);

  useEffect(() => {
    if (pmGrade10 == "좋음" || pmGrade10 == "보통"){
      setCloudImg(cleancloud);
      setDustbackLiner('#82b1ff');
    }
    else{
      setCloudImg(dustcloud);
      setDustbackLiner('#ffd180');
    }
    
  }, [pmGrade10]);

  useEffect(() => {
    const db = SQLite.openDatabase('weather.db');
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM bookmarkloc ORDER BY id DESC LIMIT 3',
        [],
        (_, { rows }) => {
          if (rows.length >= 1) {
            setFavorite1(rows.item(0).loc);
          }
          if (rows.length >= 2) {
            setFavorite2(rows.item(1).loc);
          }
          if (rows.length >= 3) {
            setFavorite3(rows.item(2).loc);
          }
        }
      );
    })
  }, []);

  return (
   
]
    // <LinearGradient colors={['#2980B9', '#6DD5FA',]} start={[0.1, 0.2]} style={styles.container}>
    
    <LinearGradient colors={[backLiner, '#6DD5FA',]} start={[0.1, 0.2]} style={styles.container}>
    
    <StatusBar style="light"></StatusBar>
]




{/* 현재날짜요일시간 */}
<Text style={styles.date}>{month}월 {day}일 {dayYo} </Text>
<View style={styles.search}>
<View style={styles.row}>

{/* 검색창 */}
<TextInput
      style={{ height: 25, width: 250, borderColor: '#455A64',borderRadius: 10, borderWidth: 1, paddingLeft: 5, marginBottom: 20, backgroundColor:'rgba(30, 100, 200, 0.1)', fontSize: 14,}}
      placeholder="지역명을 입력하세요"


      value={locationName}
      onChangeText={text => setLocationName(text)}
    />
    
    <Button title="검색" onPress={searchLocation} />
    </View>
   

{/* <FilterProd ucts /> */}
</View>  



{/* 스크롤 적용구간 */}
    <View style={styles.weather}>
      <ScrollView
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        horizontal ={false}
        contentContainerStyle={styles.weather}
      >
        {/* 현재위치 기온 & 코멘트 */}

          <View style={styles.row}>
          <View style={styles.Myloca}>
        <Text style={styles.cityName}>{city} {subregion} {district}</Text>
        <Text style={styles.temp}>{TEMP}</Text>
          <Text style={styles.description}>{SKY}</Text>

          </View>
 
     {/* 캐릭터 이미지 */}
      
          <View style={styles.image}>
            {isWeatherLoaded && ( // 기온과 강수량이 로딩된 후에 이미지가 렌더링 되도록 변경
            <Image
              style={styles.image}
              source={normal_deer}
              resizeMode={"contain"}
            />
            )}

          </View>
          
          </View>

          {/* GPT멘트 */}
          
        <View style={styles.GPTcard}>
        <Text>{advice}</Text>
          </View>

         {/* 4개 아이콘 데이터 */}
        
        <View style={styles.degree}>
        
      <View style={styles.column}>
      <Text  style={styles.dataname}>풍속</Text>
        <View style={styles.circle}>
        <Image
      style={styles.circlePad}
      source={require('./src/assets/image/weather-icon/wind.png')}
      resizeMode={"contain"}
        />
        </View>
        <Text style={styles.datavalue}>{wind}</Text >
        </View>

        <View style={styles.column}>
      <Text style={styles.dataname}>강수량</Text>
        <View style={styles.circle}>
        <Image
      style={styles.circlePad}
      source={require('./src/assets/image/weather-icon/rain-umbrella.png')}
      resizeMode={"contain"}
        />
        </View>
        <Text style={styles.datavalue}>{rainfall}</Text>
        </View>

        <View style={styles.column}>
      <Text style={styles.dataname}>체감온도</Text>
        <View style={styles.circle}>
        <Image
      style={styles.circlePad}
      source={require('./src/assets/image/weather-icon/temperature.png')}
      resizeMode={"contain"}
        />
        </View>
        <Text style={styles.datavalue}>{sensoryTEMP}</Text>
        </View>

        <View style={styles.column}>
      <Text style={styles.dataname}>최고/최저</Text>
        <View style={styles.circle}>
        <Image
      style={styles.circlePad}
      source={require('./src/assets/image/weather-icon/highlow.png')}
      resizeMode={"contain"}
        />
        </View>
        <Text style={styles.datavalue}>{upperTEMP}/{lowerTEMP}</Text>
        </View>

        </View>
        
        
    
     
     {/* 날씨 공유 메세지 */}
      
        <>
        <View style={styles.card}>
        <View style={styles.column}>
        <Text style={styles.ment}> 좋아하는 사람에게 날씨를 공유해 보는 건 어떨까요?</Text> 
        <View style={styles.rowlable}>
        <Text style={styles.ment}> 당신의 마음이 전해질 지도 몰라요~</Text> 
       
       {/* 일단 공유 이미지 말고 버튼으로 공유 기능 생성 */}
        {/* <Image
      style={styles.miniIcon}
      source={require('./src/assets/image/share.png')}
      resizeMode={"contain"}
        /> */}
        {/* 공유 버튼 누르면 gpt 멘트 공유 가능 */}
        <Button 
          title="공유"
          style={{height: 10, fontSize:10,}}
          onPress={async () => await Share.share({ message: shareTwo,})}>
        </Button>
          
        </View>
        </View>
        </View>
        </>


        
      
      {/*  미세 먼지  */}
      <LinearGradient colors={[dustbackLiner, '#6DD5FA',]} start={[0.1, 0.2]} style={styles.dustPad}>
      <View style={styles.dustPad}>
        {isWeatherLoaded && (
          <Image
          style={styles.dustIcon}
          source={cloudImg}
          resizeMode={"contain"}
            />
        )}
        <View style={styles.dustData}>
        <View styel={styles.column}>
        <Text style={styles.pmGrade}> 미세먼지 </Text> 
        <Text style={styles.pmGrade}> {pmGrade10}</Text> 
          </View>
          <View styel={styles.column}>
          <Text style={styles.pm}> 미세먼지   {pmValue10}</Text> 
          <Text style={styles.pm}> 초 미세먼지   {pmValue25}</Text> 
          </View>
        </View>
      </View>
      </LinearGradient>

      <View style={styles.title}>
      <View style={styles.rowlable}>
         <Image
      style={styles.miniIcon}
      source={require('./src/assets/image/clock.png')}
      resizeMode={"contain"}
        />
           <Text style={styles.lableblue}> 시간대별 기온</Text>
         </View>
         </View>
        <ScrollView
           pagingEnabled={false}
           showsHorizontalScrollIndicator={false}
           horizontal
           contentContainerStyle={styles.chart}>

        <View style={styles.chart}>
        
        {isLoading ? (
        <Text>Loading...</Text> // 로딩 상태 표시
        ) : (
          <> 
          {tempData && (
            <LineChart
              data={tempData}
              width={SCREEN_WIDTH*2}
              height={170}
              chartConfig={{
                backgroundColor: 'skyblue',
                backgroundGradientFrom: "#2980B9",
                backgroundGradientFromOpacity: 0.3,
                backgroundGradientTo: "rgba(50, 160, 200, 0.1)",
                decimalPlaces: 2, // optional, defaults to 2dp
                withShadow: false,
                color: (opacity = 0.8) => `rgba(30, 50, 120, ${opacity})`,
                labelColor: (opacity = 0.5) => `rgba(30, 50, 120, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: "2",
                  strokeWidth: "2",
                  // stroke: "#ffa726"
                },
                propsForBackgroundLines: {
                  color: 'rgba(80, 140, 200, 0.2)',
                  stroke:'rgba(80, 140, 200, 0.3)',
                  strokeDasharray:[],
                },
                useShadowColorFromDataset: true
              }}
            bezier
            style={{
            marginVertical: 8,
             borderRadius: 8,

              }}
        />)} 
           
          </>
        )}
        </View>
          </ScrollView>

      {/* 즐겨찾기 */}
         <View style={styles.bookmarkPad}>
         <View style={styles.myplace}>
         <View style={styles.rowlable}>
         <Image
      style={styles.miniIcon}
      source={require('./src/assets/image/weather-icon/bookmark.png')}
      resizeMode={"contain"}
        />
         <Text style={styles.lable}> MyPlace                                                        </Text>  
         {/* 플러스 버튼과 간격두기 위한 죽음의 띄어쓰기.. */}
         <Image
      style={styles.miniIcon}
      source={require('./src/assets/image/plus.png')}
      resizeMode={"contain"}
        />
         </View>

         </View>

         <View style={styles.location}>
         <Button
            title="즐겨찾기"
            onPress={() => {
              setLocationName(favorite1)
              searchLocationbk(favorite1);
            }}
          ></Button>
         <Text style={styles.ment}> {favorite1} </Text> 
         </View>

         <View style={styles.location}>
         <Button
            title="즐겨찾기"
            onPress={() => {
              setLocationName(favorite2)
              searchLocationbk(favorite2);
            }}
          ></Button>
         {/* <Text style={styles.ment}> {favorite2} </Text> */}
         </View>

         <View style={styles.location}>
         <Button
            title="즐겨찾기"
            onPress={() => {
              setLocationName(favorite3)
              searchLocationbk(favorite3);
            }}
          ></Button>
         {/* <Text style={styles.ment}> {favorite3} </Text> */}
         </View>
         </View>



        <View style={styles.week}>
        <View style={styles.weekly}>
        <Text style={styles.dayOfweek}>
            오늘
          </Text>
        <Text style={styles.high}>{lowerTEMP}</Text>
        <Text style={styles.low}>{lowerTEMP}</Text>
       </View>
   
       <View style={styles.weekly}>
        <Text style={styles.dayOfweek}>
            내일
          </Text>
        <Text style={styles.high}>{tomorrowMax}</Text>
        <Text style={styles.low}>{tomorrowMin}</Text>
       </View>
  
       <View style={styles.weekly}>
        <Text style={styles.dayOfweek}>
            모레
          </Text>
        <Text style={styles.high}>{afterTomorrowMax}</Text>
        <Text style={styles.low}>{afterTomorrowMin}</Text>
       </View>
  
       <View style={styles.weekly}>
        <Text style={styles.dayOfweek}>
          {dayofweek3}
          </Text>
        <Text style={styles.high}>{min3}.0</Text>
        <Text style={styles.low}>{max3}.0</Text>
       </View>
  
       <View style={styles.weekly}>
        <Text style={styles.dayOfweek}>
          {dayofweek4}
          </Text>
        <Text style={styles.high}>{min4}.0</Text>
        <Text style={styles.low}>{max4}.0</Text>
       </View>
  
       <View style={styles.weekly}>
        <Text style={styles.dayOfweek}>
          {dayofweek5}
          </Text>
        <Text style={styles.high}>{min5}.0</Text>
        <Text style={styles.low}>{max5}.0</Text>
       </View>
  
       <View style={styles.weekly}>
        <Text style={styles.dayOfweek}>
          {dayofweek6}  
          </Text>
        <Text style={styles.high}>{min6}.0</Text>
        <Text style={styles.low}>{max6}.0</Text>
       </View>
        
        </View>
{/* 
        <View style={styles.chart}>
        {isLoading ? (
        <Text>Loading...</Text> // 로딩 상태 표시
        ) : (
            <>{tempData && (
            <LineChart
                data={tempData}
                width={screenWidth}
                height={220}
                chartConfig={chartConfig}
            />)} 
            </>
        )}
            
        </View>
        
        <View style={styles.day}>
        {isLoading ? (
        <Text>Loading...</Text> // 로딩 상태 표시
        ) : (
        <>
            {windData && (
            <LineChart
            data={windData}
            width={screenWidth}
            height={220}
            chartConfig={chartConfig}
            />
            )}  
        </>
        )}
            
        </View>
        <View style={styles.day}>
          {isLoading ? (
          <Text>Loading...</Text> // 로딩 상태 표시
          ) : (
          <>
              {rainData && (
              <LineChart
              data={rainData}
              width={screenWidth}
              height={220}
              chartConfig={chartConfig}
              />
              )}  
          </>
          )}
          
        </View>
        <View style={styles.day}>
        {isLoading ? (
          <Text>Loading...</Text> // 로딩 상태 표시
          ) : (
              <>{sensoryData && (
              <LineChart
                  data={sensoryData}
                  width={screenWidth}
                  height={220}
                  chartConfig={chartConfig}
              />)} 
              </>
          )} */}
       
        {/* </View> */}


        </ScrollView>
        </View>
        </LinearGradient>
  
  );
  }
  
  
  
  
  const styles = StyleSheet.create({
    container:{
    paddingTop : 10,
    justifyContent: "flex-start",
    backgroundColor: "2980b9"
    //height:1800
  },
  date:{
    //flexDirection:"row",
    paddingTop:10,
    //marginTop: 30,
    marginLeft: 20,
    marginBottom: 5,
    width: 350,
    height:30,
    textAlign:"center",
    alignItems: "center",
    color: "white",
    // backgroundColor:"#E6E6FA",
    //justifyContent:"space-evenly",
    fontSize: 14
  },
  search:{
    //flexDirection:"row",
    justifyContent: "flex-start",
    marginTop: 5,
    width:SCREEN_WIDTH,
    height:20,
    textAlign:"center",
    alignItems: "center",
    // backgroundColor:"skyblue",
    //justifyContent:"space-evenly",
    fontSize:20
  
  },
  city:{
    width: 180,
    //height:18,
    //marginLeft:20,
    height: 170,
    // backgroundColor:"skyblue",
    justifyContent:"flex-start",
    textAlign: "center",
    alignItems:"center"
  },
  cityName:{
    width: 180,
    marginTop: 10,
    marginLeft: 20,
    fontSize:26,
    fontWeight:"500"
  },
  weather:{
    width : SCREEN_WIDTH,
    //height : 1000,
    justifyContent:"space-between",
    // backgroundColor:"blue",
    alignItems: "flex-start",
  },
  day:{
    width:SCREEN_WIDTH,
    height: 600,
    flexDirection:"column",
    //  backgroundColor:"#AFEEEE",
    //flex:1,
    //backgroundColor:"teal",
    alignItems:"flex-start",
    marginTop:10
  },
  
  row:{
    //backgroundColor:"#4169e1",
    justifyContent:"center",
    flexDirection:"row",
    // height: 200,
    width : 390,
   // marginBottom: 20,
  },
  column:{
    paddingBottom: 5,
    justifyContent:"flex-start",
    flexDirection:"column"
  },
  rowlable:{
    flexDirection:"row",
    paddingBottom:2
  },
  Myloca:{
    paddingLeft: 20,
    width : 180,
    height : 240,
    paddingTop: 50,
    //marginTop : 20,
    marinLeft: 10,
   //s marginRight: 5,
    //justifyContent:"flex-start",
    alignItems: "center",
    textAlign: "center",
    //backgroundColor:"skyblue",
    flexDirection:"column",
  },
  temp:{
    width : 180,
    height : 80,
    justifyContent:"flex-start",
    alignItems: "center",
    textAlign: "center",
    // backgroundColor:"skyblue",
    flexDirection:"column",
    marginLeft:20,
    //marginTop:10,
    fontSize:70
  },
  image:{
    width: 180,
    height: 240,
    justifyContent:"flex-end",
    // backgroundColor:"#000080",
    marginLeft:5,
    marginTop:10
  },
  description:{
    width:170,
    height:40,
    marginTop:5,
    marginLeft:20,
    textAlign:"center",
    // backgroundColor:"#00BFFF",
    //justifyContent:"center",
    fontSize:40

     
    
    degree:{
      flexDirection:"row",
      width: 370,
      height: 100,
      marginTop: 30,
      marginLeft:10,
      textAlign:"center",
      alignItems: "center",
      // backgroundColor:"#00BFFF",
      justifyContent:"space-evenly",
      fontSize:40
      
    },
  
    
    message:{
      //flexDirection:"row",
      marginTop: 10,
      marginLeft: 20,
     // width: 350,
      height:25,
      textAlign:"center",
      alignItems: "center",
      // backgroundColor:"#E6E6FA",
      //justifyContent:"space-evenly",
      fontFamily: "SUITE-Medium",
      fontSize:16
    
    },
  

  degree:{
    flexDirection:"row",
    width: 370,
    height: 100,
    marginTop: 5,
    marginBottom: 5,
    marginLeft:10,
    textAlign:"center",
    alignItems: "center",
    // backgroundColor:"#00BFFF",
    justifyContent:"space-evenly",
    fontSize:40

    
    miniIcon:{
      // backgroundColor: "white",
      width: 14,
      height: 16,
      marginTop: 4,
      alignItems: "center",
    },
  
  miniIcon:{
    // backgroundColor: "white",
    width: 14,
    height: 16,
    marginTop: 4,
    alignItems: "center",
  },

  card:{
    marginTop: 5,
    marginLeft: 20,
    marginBottom: 15,
    paddingLeft: 10,
    paddingTop: 3,
    width: 350,
    height: 70,
    textAlign:"left",
    alignItems: "center",
    flexDirection:"row",
    //justifyContent:"space-evenly",
    fontSize:16,
    backgroundColor: 'rgba(0, 100, 150, 0.1)',
    borderColor: 'rgba(0, 50, 0, 0.2)',
    borderWidth: 2,
    borderRadius: 15,
  },

  GPTcard:{
    marginTop: 12,
    marginLeft: 20,
    marginBottom: 5,
    paddingLeft: 10,
    paddingTop: 15,
    width: 350,
    //height: 70,
    textAlign:"left",
    alignItems: "center",
    flexDirection:"row",
    //justifyContent:"space-evenly",
    fontSize:16,
   //backgroundColor: 'rgba(0, 100, 150, 0.1)',
    borderColor: 'rgba(0, 50, 0, 0.2)',
    borderTopWidth: 2,
    borderBottomWidth: 2,
    //borderRadius: 15,
  },

 
  favo:{
    width: 30,
    height: 20,
    paddingLeft: 20,
    marginTop:5,
  },

  title:{
    width: 350,
    height: 20,
    paddingLeft: 20,
    marginTop:10,
  },

  lableblue:{
    // backgroundColor: "white",
    fontFamily: "SUITE-Medium",
    // width: 350,
    height: 18,
    marginTop: 3,
    color: 'rgba(20, 0, 50, 0.7)',
    textAlign:"left",
    //justifyContent:"space-evenly",
    
    fontSize:15,
  },

  lable:{
    // backgroundColor: "white",
    fontFamily: "SUITE-Medium",
    // width: 350,
    height: 18,
    marginTop: 2,
    color: 'rgba(0, 0, 50, 0.9)',
    textAlign:"left",
    //justifyContent:"space-evenly",
    fontSize:16,
  },

  ment:{
    // backgroundColor: "white",
    fontFamily: "SUITE-Medium",
    // width: 350,
    height: 18,
    marginTop: 8,
    textAlign:"left",
    //justifyContent:"space-evenly",
    fontSize:16,
  },



  dustPad:{
    //marginTop: 10,
    //marginBottom: 15,
    backgroundColor:'rgba(0, 50, 0, 0.2)',
    justifyContent:"center",
    flexDirection:"row",
    height: 110,
    width : 390
  },

  
    dustPad:{
      marginTop: 10,
      // backgroundColor:'rgba(0, 50, 0, 0.2)',
      justifyContent:"center",
      flexDirection:"row",
      height: 110,
      width : 390
    },
    
    dustData:{
      marginTop: 12,
      marginLeft: 10,
      paddingTop: 5,
      width: 190,
      height:80,
      flexDirection:"row",
      textAlign:"left",
      alignItems: "center",
      //backgroundColor:"#E6E6FA",
      justifyContent:"flex-start",
      fontSize:16
    },
    
    dustIcon:{
      marginTop: 15,
      //marginLeft: 20,
      width: 110,
      height:80,
      alignItems: "center",
      //backgroundColor:"#E6E6FA",
      //justifyContent:"space-evenly",
      fontSize:16
    },
   
    pmGrade:{
      //flexDirection:"row",
      marginTop: 5,
      marginLeft: 5,
     // width: 350,
      height:20,
      textAlign:"center",
      alignItems: "center",
       //backgroundColor:"#E6E6FA",
      //justifyContent:"space-evenly",
      fontFamily: "SUITE-Medium",
      fontSize:16
    
    },
  
  dustIcon:{
    marginTop: 15,
    //marginLeft: 20,
    width: 110,
    height:80,
    alignItems: "center",
    //backgroundColor:"#E6E6FA",
    //justifyContent:"space-evenly",
    fontSize:16
  },
 
  

  pmGrade:{
    //flexDirection:"row",
    marginTop: 5,
    marginLeft: 5,
   // width: 350,
    height:20,
    textAlign:"center",
    alignItems: "center",
     //backgroundColor:"#E6E6FA",
    //justifyContent:"space-evenly",
    fontFamily: "SUITE-Medium",
    fontSize:16
  
  },

  pm:{
    //flexDirection:"row",
    marginTop: 10,
    marginLeft: 20,
   // width: 350,
    height:20,
    textAlign:"center",
    alignItems: "center",
   //backgroundColor:"#E6E6FA",
    //justifyContent:"space-evenly",
    Family: "SUITE-Medium",
    color: "#223254",
    fontSize: 13
  
  },

  

  myplace:{
    //backgroundColor: "white",
    width: 300,
    flexDirection:"row",
    marginTop: 12,
    marginBottom: 10,
    borderBottomColor: 'rgba(0, 50, 100, 0.1)',
    borderBottomWidth: 1,
    paddingBottom: 2,
    height: 26,
    textAlign:"left",
    //alignItems: "center",
    justifyContent:"flex-start",
    fontSize:16,
    // borderColor: 'rgba(0, 50, 0, 0.2)',
    // borderWidth: 2,
    // borderRadius: 15,
  },
  
  bookmarkPad:{
    paddingLeft: 10,
    paddingBottom: 10,
    flexDirection:"column",
    justifyContent:"flex-start",
    width: 350,
    //height: 150,
    marginTop: 10,
    marginLeft:20,
    textAlign:"left",
    //alignItems: "center",
    backgroundColor:'rgba(051, 153, 204, 0.3)',
    fontSize:40
  
  },

  location:{
    paddingLeft: 10,
    flexDirection:"column",
    width: 330,
    height: 60,
    //marginTop: 40,
    marginLeft: 15,
    textAlign:"left",
    alignItems: "left",
   // backgroundColor:'rgba(051, 153, 204, 0.3)',
    justifyContent:"space-evenly",
    fontSize:40
  },

  week:{
    width:SCREEN_WIDTH,
    flexDirection:"column",

  
    
  
    myplace:{
      //backgroundColor: "white",
      width: 300,
      flexDirection:"row",
      marginTop: 12,
      //marginBottom: 5,
      borderBottomColor: 'rgba(0, 50, 100, 0.1)',
      borderBottomWidth: 1,
      paddingBottom: 2,
      height: 26,
      textAlign:"left",
      //alignItems: "center",
      justifyContent:"flex-start",
      fontSize:16,
      // borderColor: 'rgba(0, 50, 0, 0.2)',
      // borderWidth: 2,
      // borderRadius: 15,
    },
    

  },
  dayOfweek:{
   
    flexDirection:"row",
    width: 60,
    height: 20,
    marginTop: 13,
    marginLeft : 5,
    marginRight : 40,
    textAlign:"center",
    alignItems: "flex-start",
    fontFamily: "SUITE-Medium",
   
  // backgroundColor:"#4169e1",
    //justifyContent:"space-evenly",
    fontSize:16
    
  },
  weekly:{
    backgroundColor:'rgba(100, 150, 204, 0.3)',
    flexDirection:"row",
    width: 350,
    height: 50,
    marginLeft : 20,
    paddingLeft : 20,
    paddingRight : 20,
    textAlign:"center",
    alignItems: "flex-start",
    // backgroundColor:"#4169e1",
    justifyContent:"space-evenly",
    fontSize:20
  },

  table:{
    flexDirection:"row",
    width: SCREEN_WIDTH*2,
    height: 80,
    marginTop: 5,
    textAlign:"center",
    alignItems: "flex-start",
    borderBottomColor: 'rgba(0, 50, 100, 0.1)',
    justifyContent:"space-evenly",
    fontSize:40
  },
  chart:{
    width:SCREEN_WIDTH*2,
    height: 190,
    flexDirection:"column",
    borderBottomColor: 'rgba(100, 100, 150, 0.1)',
    //flex:1,
    //backgroundColor:"teal",
    alignItems:"flex-start",
    //marginTop:3,
  },
  time:{
    //flexDirection:"row",
    marginTop: 5,
    width: 40,
    height: 15,
    textAlign:"center",
    alignItems: "center",
    backgroundColor:'rgba(100, 100, 200, 0.2)',
    //justifyContent:"space-evenly",
    fontSize:10
    
  },
  icon:{
    //flexDirection:"row",
    marginTop:5,
    width: 40,
    height:40,
    textAlign:"center",
    alignItems: "center",
    backgroundColor:'rgba(100, 100, 200, 0.2)',
    //justifyContent:"space-evenly",
    fontSize:20
    
  },
  hum:{
    //flexDirection:"row",
    marginTop:5,
    width: 60,
    height:40,
    textAlign:"left",
    alignItems: "center",
    backgroundColor:"#6495ED",
    //justifyContent:"space-evenly",
    fontSize:20
  },
  high:{
    //flexDirection:"row",
    marginTop:5,
    width: 40,
    height: 40,
    paddingTop: 7,
    textAlign:"center",
    alignItems: "center",
   // backgroundColor:"#20B2AA",
    fontFamily: "SUITE-Medium",
    fontSize:16,
    color: "#945050",
    textShadowColor: 'rgba(100, 50, 80, 0.5)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 15
  },
  low:{
    //flexDirection:"row",
    marginTop:5,
    width: 40,
    height: 40,
    paddingTop: 7,
    textAlign:"center",
    alignItems: "center",
   // backgroundColor:"#20B2AA",
    fontFamily: "SUITE-Medium",
    fontSize:16,
    color: "#3C5087",
    textShadowColor: 'rgba(50, 80, 100, 0.5)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 15
  },

  }
  ) 
  

