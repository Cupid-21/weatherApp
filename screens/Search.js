import React, {useEffect, useState} from 'react';
import { StatusBar } from "expo-status-bar";
import { 
  View, 
  Text, Dimensions, 
  StyleSheet, ScrollView, TextInput, Button, Image, Share } from 'react-native';
import extractUltraSrtWeather from './Main';
import {extractVilageWeather} from './Main';
import {commentWeather} from './Main';
import {sensoryTemp} from './Main'
import {makeSensoryData} from './Main'
import { makeData } from './Main';
import { getDayofweek } from './Main';
import {
    LineChart,
  } from "react-native-chart-kit";
import {LinearGradient} from 'expo-linear-gradient';
import * as SQLite from 'expo-sqlite';



const {width:SCREEN_WIDTH} = Dimensions.get("window");
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


const toDay = new Date();

const month = (toDay.getMonth() + 1).toString();
const day = toDay.getDate().toString().padStart(2, '0');
const d = toDay.getDay();
const week = getDayofweek();
const dayYo = week[d];
console.log("오늘", dayYo);
  

const Search = ({ navigation, route }) => {
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

  const [TEMP, setTemp]=useState();
  const [SKY, setSky]=useState();
  const [wind, setWind]=useState();
  const [rainfall, setRainfall]=useState();
  const [sensoryTEMP, setSensoryTemp]=useState();

  const [lowerTEMP, setLowerTemp]=useState();
  const [upperTEMP, setUpperTemp]=useState();

  const [pmGrade10, setPmGrade10]=useState();
  const [pmGrade25, setPmGrade25]=useState();
  const [pmValue10, setPmValue10]=useState();
  const [pmValue25, setPmValue25]=useState();

  const [district, setDistrict]=useState(); // 현재 지역 이름
  const [locationName, setLocationName]=useState(); // 검색 지역 이름

  const [tempData, setTempData]=useState(null);
  const [windData, setWindData]=useState(null);
  const [rainData, setRainData]=useState(null);
  const [sensoryData, setSensoryData]=useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [adviceTemp, setAdviceTemp]=useState();
  const [adviceWind, setAdviceWind]=useState();
  const [adviceFall, setAdviceFall]=useState();
  const [adviceSensory, setAdviceSensory]=useState();

  const [gptTemp, setGptTemp]=useState();
  const [gptSrcTemp, setGptSrcTemp]=useState();
  const [gptWind, setGptWind]=useState();
  const [gptSrcWind, setGptSrcWind]=useState();
  const [gptFall, setGptFall]=useState();
  const [gptSrcFall, setGptSrcFall]=useState();
  const [gptSensory, setGptSensory]=useState();
  const [gptSrcSensory, setGptSrcSensory]=useState();

  // 이미지 동적 변경을 위한
  const [isWeatherLoaded, setIsWeatherLoaded] = useState(false);
  


  const getSearchWeather = async () => {

      const { srcUltraSrtInfo, srcVilageInfo, srcPmlist } = route.params;
      

      setSensoryTemp(sensoryTemp(parseFloat(ultraSrtWeatherInfo.temperature),parseFloat(ultraSrtWeatherInfo.humidity)));
      setRainfall(srcUltraSrtInfo.rainfall);
      setTemp(JSON.stringify(commentWeather(srcUltraSrtInfo,"ultraSrt").temperature).replace(/\"/gi, "")); // 기온
      setSky(JSON.stringify(commentWeather(srcUltraSrtInfo,"ultraSrt").sky).replace(/\"/gi, "")); // 하늘 상태
      setWind(JSON.stringify(commentWeather(srcUltraSrtInfo,"ultraSrt").wind).replace(/\"/gi, "")); // 풍속

      setLowerTemp(JSON.stringify(srcVilageInfo.lowerTmp).replace(/\"/gi, ""));
      setUpperTemp(JSON.stringify(srcVilageInfo.upperTmp).replace(/\"/gi, ""));

      setPmGrade10(srcPmlist[0]);
      setPmGrade25(srcPmlist[1]);
      setPmValue10(srcPmlist[2]);
      setPmValue25(srcPmlist[3]);

      setIsWeatherLoaded(true);
  }

  const compareWeather = async () => {
      
      const { srcUltraSrtInfo, srcVilageInfo, searchTmpForTime, searchWindForTime, searchRainForTime, searchHumidityForTime, vilageJson,
              district, loc } = route.params;

      setDistrict(district);
      setLocationName(loc);

      
  
      // getWeather에서 생성한 vilageJson 사용
      // 6,9,12,15,18,21시 기온
      currentTmpForTime=extractVilageWeather(vilageJson)[1]; 
      //searchTmpForTime=extractVilageWeather(searchJson)[1];
      const currentTmpList=makeData(currentTmpForTime);
      setGptTemp(currentTmpList);
      const searchTmpList=makeData(searchTmpForTime);
      setGptSrcTemp(searchTmpList);
      //console.log("검색 지역 기온 : ", searchTmpForTime);
  
      // 6,9,12,15,18,21시 풍속
      currentWindForTime=extractVilageWeather(vilageJson)[2]; 
      setGptWind(makeData(currentWindForTime));
      //searchWindForTime=extractVilageWeather(searchJson)[2];
      setGptSrcWind(makeData(searchWindForTime));
  
      // 6,9,12,15,18,21시 강수량
      currentRainForTime=extractVilageWeather(vilageJson)[3];
      setGptFall(makeData(currentRainForTime));
      //searchRainForTime=extractVilageWeather(searchJson)[3];
      setGptSrcFall(makeData(searchRainForTime));
  
      // 6,9,12,15,18,21시 습도
      currentHumidityForTime=extractVilageWeather(vilageJson)[4];
      //searchHumidityForTime=extractVilageWeather(searchJson)[4];
      const currentHumidityList=makeData(currentHumidityForTime);
      const searchHumidityList=makeData(searchHumidityForTime);
  
      const currentSensoryData = makeSensoryData(currentTmpList,currentHumidityList);
      setGptSensory(currentSensoryData);
      const searchSensoryData = makeSensoryData(searchTmpList,searchHumidityList);
      setGptSrcSensory(searchSensoryData);

      const dataForTmp = {
        labels: ["6시", "9시", "12시", "15시", "18시", "21시", "24시"],
        datasets : [
          {
            data: makeData(currentTmpForTime),
            color: (opacity = 1) => `rgba(0, 0, 200, ${opacity})`, // 첫 번째 데이터 세트의 색상
            strokeWidth: 2 // 첫 번째 데이터 세트의 선 두께
          },
          {
            data: makeData(searchTmpForTime),
            color: (opacity = 1) => `rgba(200, 0, 0, ${opacity})`, // 두 번째 데이터 세트의 색상
            strokeWidth: 2 // 두 번째 데이터 세트의 선 두께
          }
        ],
        // legend: ["시간대별 기온 비교"] // optional
      };
  
      const dataForWind = {
        labels: ["6시", "9시", "12시", "15시", "18시", "21시"],
        datasets : [
          {
            data: makeData(currentWindForTime),
            color: (opacity = 1) => `rgba(0, 0, 200, ${opacity})`, // 첫 번째 데이터 세트의 색상
            strokeWidth: 2 // 첫 번째 데이터 세트의 선 두께
          },
          {
            data: makeData(searchWindForTime),
            color: (opacity = 1) => `rgba(200, 0, 0, ${opacity})`, // 두 번째 데이터 세트의 색상
            strokeWidth: 2 // 두 번째 데이터 세트의 선 두께
          }
        ],
        // legend: ["시간대별 풍속 비교"] // optional
      };
  
      const dataForRain = {
        labels: ["6시", "9시", "12시", "15시", "18시", "21시"],
        datasets : [
          {
            data: makeData(currentRainForTime),
            color: (opacity = 1) => `rgba(0, 0, 200, ${opacity})`, // 첫 번째 데이터 세트의 색상
            strokeWidth: 2 // 첫 번째 데이터 세트의 선 두께
          },
          {
            data: makeData(searchRainForTime),
            color: (opacity = 1) => `rgba(200, 0, 0, ${opacity})`, // 두 번째 데이터 세트의 색상
            strokeWidth: 2 // 두 번째 데이터 세트의 선 두께
          }
        ],
        // legend: ["시간대별 강수량 비교"] // optional
      };
  
      const dataForSensory = {
        labels: ["6시", "9시", "12시", "15시", "18시", "21시"],
        datasets : [
          {
            data: currentSensoryData,
            color: (opacity = 0.5) => `rgba(0, 0, 200, ${opacity})`, // 첫 번째 데이터 세트의 색상
            strokeWidth: 2 // 첫 번째 데이터 세트의 선 두께
          },
          {
            data: searchSensoryData,
            color: (opacity = 0.5) => `rgba(200, 0, 0, ${opacity})`, // 두 번째 데이터 세트의 색상
            strokeWidth: 2 // 두 번째 데이터 세트의 선 두께
          }
        ],
        // legend: ["시간대별 체감온도 비교"] // optional
      };
  
      // console.log("data 확인",data.datasets[0].data);
      setTempData(dataForTmp);
      setWindData(dataForWind);
      setRainData(dataForRain);
      setSensoryData(dataForSensory);
      setIsLoading(false); // 데이터 로딩 완료 상태 설정
  
    
    };

    const getAdvice = async (content,type) => {
      const api_key = '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';
      // const keywords = '커피';
      const messages = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: content },
      ];
      console.log({TEMP});
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
        
        if (choices){
          let resultText = '';
          choices.forEach((choice, index) => {
            resultText += `${choice.message.content}\n`;
          });
          console.log(resultText);

          switch (type){
            case "Temp":
              setAdviceTemp(resultText);
              break;
            case "Wind":
              setAdviceWind(resultText);
              break;
            case "Fall":
              setAdviceFall(resultText);
              break;
            case "Sensory":
              setAdviceSensory(resultText);
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

    const bookmarkLocation = async () => {
      const db = SQLite.openDatabase('weather.db');
    
      db.transaction(tx => {
        tx.executeSql(
          'CREATE TABLE IF NOT EXISTS bookmarkloc (id INTEGER PRIMARY KEY AUTOINCREMENT, loc TEXT);'
        );
        
      });
    };
  
  

    useEffect(() => {
      getSearchWeather();
      compareWeather();
      bookmarkLocation();
      console.log("data 확인", gptTemp, gptSrcTemp);
      
      const adviceTypes = [
        { content: '현재 위치의 시간대별 기온' + gptTemp + '와, 검색지역의 시간대별 기온 ' + gptSrcTemp + '을 비교분석 한 뒤에 재밌는 한마디 부탁해', type: 'Temp' },
        { content: '현재 위치의 시간대별 풍속' + gptWind + '와, 검색지역의 시간대별 풍속 ' + gptSrcWind + '을 비교분석 한 뒤에 재밌는 한마디 부탁해', type: 'Wind' },
        { content: '현재 위치의 시간대별 강수량' + gptFall + '와, 검색지역의 시간대별 강수량 ' + gptSrcFall + '을 비교분석 한 뒤에 재밌는 한마디 부탁해', type: 'Fall' },
        { content: '현재 위치의 시간대별 체감온도' + gptSensory + '와, 검색지역의 시간대별 체감온도 ' + gptSrcSensory + '을 비교분석 한 뒤에 재밌는 한마디 부탁해', type: 'Sensory' }
      ];
      
      let currentIndex = 0;
      
      const callGetAdvice = () => {
        const { content, type } = adviceTypes[currentIndex];
        getAdvice(content, type);
        
        currentIndex++;
        if (currentIndex < adviceTypes.length) {
          setTimeout(callGetAdvice, 10000); // 10초 지연 후 다음 호출
        }
      };
      
      callGetAdvice();
      
      return () => {
        // 정리 함수에서 타이머를 정리
        clearTimeout(callGetAdvice);
      };
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


  

  

    return (
<>
      <LinearGradient colors={[backLiner, '#C4E0E5',]} start={[0.1, 0.2]} style={styles.container}>
      <StatusBar style="light"></StatusBar>



{/* 현재날짜요일시간 */}
<Text style={styles.date}>{month}월 {day}일 {dayYo} </Text>


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
        {/* <Text style={styles.cityName}>{city} {subregion} {district}</Text> */}
        <Text style={styles.cityName}>{locationName}</Text>
        <Text style={styles.temp}>{TEMP}</Text>
          <Text style={styles.description}>{SKY}</Text>
          {/* <Text style={styles.message}>{advice}</Text> */}
          </View>
 
          
     {/* 캐릭터 이미지 */}

     <View style={styles.image}>
            {isWeatherLoaded && ( // 기온과 강수량이 로딩된 후에 이미지가 렌더링 되도록 변경
            <Image
              style={styles.image}
              source={deerImg}
              resizeMode={"contain"}
            />
            )}
          </View>
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
        
        <View style={styles.GPTcard}>
        <Text>{adviceTemp}</Text>
          </View>
              
        <LinearGradient colors={[dustbackLiner, '#6DD5FA',]} start={[0.1, 0.2]} style={styles.container}>
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


<View style={styles.detail}>

            {/* <View>
             
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
                <Button title="기온" />
                <Button title="체감온도" />
                <Button title="미세먼지" />
                <Button title="풍속" />
                <Button title="강수량" />
              </View>
            </View> */}


        <ScrollView
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            horizontal 
            contentContainerStyle={styles.detail}
      >
        <View style={styles.day}>

   
        

            <View style={styles.title}>
            <Image
            style={styles.miniIcon}
            source={require('./src/assets/image/clock.png')}
            resizeMode={"contain"}
              />
            <Text style={styles.lable}>시간대별 체감온도 비교</Text>
            <Text style={styles.currentlable}>                                 ● 현재 위치</Text>
            <Text style={styles.searchlable}>    ● 검색 위치</Text>
            </View>
            <View style={styles.chart}>
            {isLoading ? (
          <Text>Loading...</Text> // 로딩 상태 표시
          ) : (
              <>{sensoryData && (
              <LineChart
                  data={sensoryData}
                  width={380}
                  height={160}
                  chartConfig={{
                    backgroundColor: 'skyblue',
                    backgroundGradientFrom: "#2980B9",
                    backgroundGradientFromOpacity: 0,
                    backgroundGradientTo: "rgba(50, 160, 200, 0.1)",
                    backgroundGradientToOpacity: 0.5,
                    decimalPlaces: 2, // optional, defaults to 2dp
                    withShadow: false,
                    color: (opacity = 0.8) => `rgba(10, 80, 120, ${opacity})`,
                    labelColor: (opacity = 0.5) => `rgba(50, 100, 180, ${opacity})`,
                    style: {
                      borderRadius: 12,
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
                    useShadowColorFromDataset: false
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
          </View>

          <View style={styles.day}>
          <View style={styles.title}>
            <Image
            style={styles.miniIcon}
            source={require('./src/assets/image/clock.png')}
            resizeMode={"contain"}
              />
            <Text style={styles.lable}>시간대별 강수량 비교</Text>
            <Text style={styles.currentlable}>                                       ● 현재 위치</Text>
            <Text style={styles.searchlable}>    ● 검색 위치</Text>
            </View>
          {isLoading ? (
          <Text>Loading...</Text> // 로딩 상태 표시
          ) : (
          <>
              {rainData && (
              <LineChart
              data={rainData}
              width={380}
              height={160}
              chartConfig={{
                backgroundColor: 'skyblue',
                backgroundGradientFrom: "#2980B9",
                backgroundGradientFromOpacity: 0,
                backgroundGradientTo: "rgba(50, 160, 200, 0.1)",
                backgroundGradientToOpacity: 0.5,
                decimalPlaces: 2, // optional, defaults to 2dp
                withShadow: false,
                color: (opacity = 0.8) => `rgba(10, 80, 120, ${opacity})`,
                labelColor: (opacity = 0.5) => `rgba(50, 100, 180, ${opacity})`,
                style: {
                  borderRadius: 12,
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
                useShadowColorFromDataset: false
              }}
            bezier
            style={{
            marginVertical: 8,
             borderRadius: 8,

              }}
          />
              )}  
          </>
          )}

        </View>

       

        <View style={styles.day}>
        <View style={styles.title}>
            <Image
            style={styles.miniIcon}
            source={require('./src/assets/image/clock.png')}
            resizeMode={"contain"}
              />
            <Text style={styles.lable}>시간대별 풍속 비교</Text>
            <Text style={styles.currentlable}>                                       ● 현재 위치</Text>
            <Text style={styles.searchlable}>    ● 검색 위치</Text>
            </View>
        {isLoading ? (
        <Text>Loading...</Text> // 로딩 상태 표시
        ) : (
        <>
            {windData && (
            <LineChart
            data={windData}
            width={380}
            height={160}
            chartConfig={{
              backgroundColor: 'skyblue',
              backgroundGradientFrom: "#2980B9",
              backgroundGradientFromOpacity: 0,
              backgroundGradientTo: "rgba(50, 160, 200, 0.1)",
              backgroundGradientToOpacity: 0.5,
              decimalPlaces: 2, // optional, defaults to 2dp
              withShadow: false,
              color: (opacity = 0.8) => `rgba(10, 80, 120, ${opacity})`,
              labelColor: (opacity = 0.5) => `rgba(50, 100, 180, ${opacity})`,
              style: {
                borderRadius: 12,
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
              useShadowColorFromDataset: false
            }}
          bezier
          style={{
          marginVertical: 8,
           borderRadius: 8,

            }}
        />
            )}  
        </>
        )}
            
        </View>
        
        
        
        </ScrollView>
        </View>
        
        </ScrollView>
</View>

        </LinearGradient>
        </>
    );
    
}








const styles = StyleSheet.create({
  container:{
    // paddingTop : 10,
    alignItems: "center",
    justifyContent: "flex-start",
   // backgroundColor: "2980b9"
    // height:1500
  },
  
    date:{
      //flexDirection:"row",
      paddingTop:10,
      marginTop: 5,
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

    detail:{
      height: 350,
    },

    detailTitle:{ 
      fontSize: 30,

    },

    search:{
      //flexDirection:"row",
      justifyContent: "flex-start",
      marginTop: 5,
      width:SCREEN_WIDTH,
      height:40,
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
      marginBottom: 3,
      fontSize:30,
      textAlign: "center",
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
     // height: 600,
      flexDirection:"column",
        backgroundColor:'rgba(30, 100, 200, 0.1)',
      //flex:1,
      //backgroundColor:"teal",
      alignItems:"flex-start",
      marginTop:10
    },
    
    row:{
      //backgroundColor:"#4169e1",
      justifyContent:"center",
      flexDirection:"row",
      height: 200,
      width : 390,
      marginBottom: 10,
    },
    column:{
      paddingBottom: 5,
      justifyContent:"flex-start",
      flexDirection:"column"
    },
    rowlable:{
      flexDirection:"row"
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
      width : 300,
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
      fontSize:35
      
    },
    
    circle: {
      width: 45,
      height: 45,
      borderRadius: 100 / 2,
      backgroundColor: 'rgba(30, 100, 200, 0.1)'
    },
    circlePad: {
      width: 45,
      height: 45,
      // backgroundColor: 'rgba(30, 100, 200, 0.1)'
    },
    datavalue: {
      width: 45,
      height: 12,
      fontFamily: "SUITE-Medium",
      fontSize: 10,
      textAlign:"center",
      marginTop : 3,
      //backgroundColor: "blue"
    },
    dataname: {
      width: 45,
      height: 12,
      fontFamily: "SUITE-Medium",
      fontSize : 10,
      textAlign:"center",
      marginBottom : 3
  
      //backgroundColor: "blue"
    },
   
    
    degree:{
      flexDirection:"row",
      width: 370,
      height: 100,
      marginTop: 15,
      marginLeft:10,
      textAlign:"center",
      alignItems: "center",
      // backgroundColor:"#00BFFF",
      justifyContent:"space-evenly",
      fontSize:40
      
    },
  
  
    chatGPT:{
      flexDirection:"row",
      width: 370,
      // height: 100,
      marginTop: 10,
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
  
    
    miniIcon:{
      // backgroundColor: "white",
      width: 14,
      height: 16,
      marginTop: 4,
      alignItems: "center",
    },
  
    card:{
      marginTop: 12,
      marginLeft: 20,
      marginBottom: 15,
      paddingLeft: 10,
      paddingTop: 3,
      width: 350,
      height: 200,
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
      marginTop: 5,
      marginLeft: 20,
      marginBottom: 15,
      paddingLeft: 10,
      paddingTop: 15,
      width: 350,
     // height: 70,
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

    ment:{
      // backgroundColor: "white",
      fontFamily: "SUITE-Medium",
      // width: 350,
      height: 18,
      margin: 2,

      textAlign:"left",
      //justifyContent:"space-evenly",
      fontSize:16,
    },
  
    lable:{
      // backgroundColor: "white",
      fontFamily: "SUITE-Medium",
      // width: 350,
      height: 18,
      margin: 4,
      color: 'rgba(30, 50, 120, 0.8)',
      textAlign:"left",
      //justifyContent:"space-evenly",
      fontSize:14,
    },

    currentlable:{
      // backgroundColor: "white",
      fontFamily: "SUITE-Medium",
      // width: 350,
      height: 18,
      marginTop: 7,
      color: 'rgba(50, 80, 150, 0.8)',
      textAlign:"left",
      //justifyContent:"space-evenly",
      fontSize:11,
    },

    searchlable:{
      // backgroundColor: "white",
      fontFamily: "SUITE-Medium",
      // width: 350,
      height: 18,
      marginTop: 7,
      color: 'rgba(150, 80, 50, 0.8)',
      textAlign:"left",
      //justifyContent:"space-evenly",
      fontSize:11,
    },

    title:{
      flexDirection:"row",
      width: 350,
      height: 20,
      paddingLeft: 20,
      
    },
  
    dustPad:{
      //marginTop: 10,
      backgroundColor:'rgba(0, 50, 0, 0.2)',
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
      fontFamily: "SUITE-Medium",
      color: "#223254",
      fontSize: 13
    
    },
  
    chart:{
      width:SCREEN_WIDTH*2,
      height: 250,
      flexDirection:"column",
      marginLeft:4,
      //flex:1,
      //backgroundColor:"teal",
      alignItems:"flex-start",
      marginTop:3,
    },
  
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
    
    bookmarkPad:{
      paddingLeft: 10,
      paddingBottom: 10,
      flexDirection:"column",
      justifyContent:"flex-start",
      width: 350,
      //height: 150,
      marginTop: 20,
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
      height: 130,
      //marginTop: 40,
      //marginLeft:20,
      textAlign:"left",
      //alignItems: "center",
      backgroundColor:'rgba(051, 153, 204, 0.3)',
      justifyContent:"space-evenly",
      fontSize:40
    },
  
    week:{
      width:SCREEN_WIDTH,
      flexDirection:"column",
    
      height: 700,
      marginTop: 10,
    
      textAlign:"center",
      alignItems: "flex-start",
      //backgroundColor:"#00BFFF",
      justifyContent:"flex-start",
      fontSize:40,
      marginBttom: 100
      
    },
    dayOfweek:{
     
      flexDirection:"row",
      width: 100,
      height: 20,
      marginTop: 17,
      marginLeft : 5,
      textAlign:"left",
      alignItems: "flex-start",
      backgroundColor:"#4169e1",
      //justifyContent:"space-evenly",
      fontSize:16
      
    },
    weekly:{
     
      flexDirection:"row",
      width: 360,
      height: 50,
      marginLeft : 15,
      textAlign:"center",
      alignItems: "flex-start",
      backgroundColor:"#4169e1",
      justifyContent:"space-evenly",
      fontSize:20
    },
  }
)
  


export default Search;

// return (
//     <View>
//       <Button
//         title="Test 열기"
//         onPress={() => navigation.navigate('Test')}
//       />
//     </View>
//   );