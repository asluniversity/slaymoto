/* SLAY MOTO shape helper: draws a recorded route (lat/lng points, optional speeds) onto a canvas, or as a small thumbnail. */
window.SlayShape={
  draw(g,P,x,y,w,h,o){o=o||{};if(!P||P.length<2)return null;
    let a0=1e9,a1=-1e9,n0=1e9,n1=-1e9,v0=1e9,v1=-1e9;
    P.forEach(p=>{a0=Math.min(a0,p[0]);a1=Math.max(a1,p[0]);n0=Math.min(n0,p[1]);n1=Math.max(n1,p[1]);if(p[2]!=null){v0=Math.min(v0,p[2]);v1=Math.max(v1,p[2]);}});
    const k=Math.cos((a0+a1)/2*Math.PI/180),ww=(n1-n0)*k||1e-7,hh=(a1-a0)||1e-7,s=Math.min(w/ww,h/hh),ox=x+(w-ww*s)/2,oy=y+(h-hh*s)/2;
    const X=p=>ox+(p[1]-n0)*k*s,Y=p=>oy+(a1-p[0])*s;g.lineCap=g.lineJoin='round';g.lineWidth=o.lw||6;
    for(let i=1;i<P.length;i++){const v=P[i][2];g.strokeStyle=v!=null&&v1>v0?`hsl(${200-200*((v-v0)/(v1-v0))},90%,55%)`:(o.color||'#38bdf8');
      g.beginPath();g.moveTo(X(P[i-1]),Y(P[i-1]));g.lineTo(X(P[i]),Y(P[i]));g.stroke();}
    return{X,Y};},
  thumb(P,w,h){w=w||64;h=h||44;if(!P||P.length<2)return '';const c=document.createElement('canvas');c.width=w*2;c.height=h*2;const g=c.getContext('2d');
    g.fillStyle='rgba(56,189,248,.07)';g.fillRect(0,0,w*2,h*2);
    const m=this.draw(g,P.map(p=>[p[0],p[1]]),14,14,w*2-28,h*2-28,{lw:5});
    if(m){[[P[0],'#4fd18b'],[P[P.length-1],'#e5554f']].forEach(([p,cl])=>{g.beginPath();g.arc(m.X(p),m.Y(p),6,0,7);g.fillStyle=cl;g.fill();});}
    return c.toDataURL('image/png');}
};
