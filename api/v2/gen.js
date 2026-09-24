export default function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  const total=parseInt(req.query.count)||1;
  let accounts=[],attempts=0;
  for(let i=0;i<total;i++){
    attempts++;
    if(Math.random()>0.3){
      const code='ACC-'+Math.random().toString(36).slice(2,10).toUpperCase();
      accounts.push({id:code,status:'created',ts:Date.now()});
    }
  }
  res.status(200).json({accounts,attempts_made:attempts,success:accounts.length>0,total_created:accounts.length,total_requested:total});
}
