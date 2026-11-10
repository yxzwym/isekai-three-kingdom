(function(root){
  'use strict';
  const G=typeof module!=='undefined'&&module.exports?require('./character-growth.js'):root.CharacterGrowth;
  const integer=n=>Number.isFinite(Number(n))?Math.min(Number.MAX_SAFE_INTEGER,Math.max(0,Math.floor(Number(n)))):0;
  const points=n=>Number.isFinite(Number(n))?Math.round(Math.min(Number.MAX_SAFE_INTEGER/100,Math.max(0,Number(n)))*100)/100:0;
  function smoothCosts(count,total,first,last){
    let lo=.01,hi=20;
    const values=power=>Array.from({length:count},(_,i)=>first+(last-first)*(i/(count-1))**power);
    for(let i=0;i<80;i++){const mid=(lo+hi)/2;if(values(mid).reduce((a,b)=>a+b,0)>total)lo=mid;else hi=mid;}
    const raw=values((lo+hi)/2),costs=raw.map(Math.floor),order=raw.map((v,i)=>({i,fraction:v-costs[i]})).filter(v=>v.i>0&&v.i<count-1).sort((a,b)=>b.fraction-a.fraction);
    let missing=total-costs.reduce((a,b)=>a+b,0);for(let i=0;missing>0;i++,missing--)costs[order[i%order.length].i]++;return costs;
  }
  const range=(count,start,step=0)=>Array.from({length:count},(_,i)=>start+i*step);
  const stages=[
    {id:'star-1',label:'一星',costs:range(9,10),approximate:false},
    {id:'star-2',label:'二星',costs:smoothCosts(29,642,10,40),approximate:true},
    {id:'star-3',label:'三星',costs:smoothCosts(39,3560,45,140),approximate:true},
    {id:'star-4',label:'四星',costs:range(49,150,5),approximate:false},
    {id:'star-5',label:'五星',costs:smoothCosts(59,44770,400,1260),approximate:true},
    {id:'moon',label:'月阶',costs:[...range(25,5000,200),...range(64,10000),...range(10,15000,1000)],approximate:false},
    {id:'sun',label:'日阶',costs:[...range(9,25000,500),...range(30,50000,200),...range(110,56000,500)],approximate:false}
  ];
  let curveLevel=1;for(const stage of stages)stage.costs=stage.costs.map(cost=>Math.max(cost,20*curveLevel++));
  const costs=stages.flatMap(stage=>stage.costs),maxLevel=costs.length+1,cumulative=[0];for(const cost of costs)cumulative.push(cumulative.at(-1)+cost);
  let startLevel=1;for(const stage of stages){stage.startLevel=startLevel;stage.endLevel=startLevel+stage.costs.length;stage.total=stage.costs.reduce((a,b)=>a+b,0);startLevel=stage.endLevel;}
  const required=level=>costs[Math.max(1,integer(level))-1]??Infinity;
  function normalizeRecord(record){
    const next=JSON.parse(JSON.stringify(record)),level=Math.max(1,integer(next.level)),old=points(next.experience);
    next.experience=next.experienceVersion===2?old:Math.floor(Math.min(.999999,old/(50*level))*Math.min(required(level),Number.MAX_SAFE_INTEGER));next.experienceVersion=2;return next;
  }
  function rewardForEnemy(enemy,member){
    const level=Math.max(1,integer(member.level)),difference=Math.max(-5,Math.min(5,Math.max(1,integer(enemy.level))-level));
    if(difference<=-5||level>=maxLevel)return 0;
    const multiplier=[0,.1,.25,.45,.7,1,1.04,1.08,1.12,1.16,1.2][difference+5];
    return points(required(Math.max(1,Math.min(maxLevel-1,integer(enemy.level))))*multiplier/10*Math.max(0,Math.min(5,Number(enemy.experienceWeight??1)||0)));
  }
  const reward=(enemies,member)=>points((enemies||[]).reduce((sum,enemy)=>sum+rewardForEnemy(enemy,member),0));
  function grant(record,amount){
    const normalized=normalizeRecord(record),current=Math.max(1,integer(normalized.level)),available=points(normalized.experience+points(amount)),base=cumulative[Math.min(current,maxLevel)-1];
    let low=Math.min(current,maxLevel),high=maxLevel;
    while(low<high){const middle=Math.ceil((low+high)/2);if(cumulative[middle-1]-base<=available)low=middle;else high=middle-1;}
    const level=Math.max(current,low),spent=cumulative[Math.min(level,maxLevel)-1]-base,next={...normalized,level,experience:points(available-spent)};
    if(next.baseAttributes&&next.potentials){next.attributes=G.attributesAt(next.baseAttributes,next.potentials,next.level);if(next.id!=='hero')Object.assign(next,next.attributes);}
    return {record:next,amount:points(amount),before:current,after:next.level};
  }
  const api={required,reward,rewardForEnemy,grant,normalizeRecord,stages,costs,cumulative,maxLevel,display:n=>String(points(n))};root.CharacterExperience=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
