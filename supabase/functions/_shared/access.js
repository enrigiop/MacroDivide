export function entitled(row,now=Date.now()){
 if(!row||row.risk_hold)return false;
 if(row.status==='trialing')return !!row.trial_end&&Date.parse(row.trial_end)>now;
 return row.status==='active'&&!!row.period_end&&Date.parse(row.period_end)>now;
}
