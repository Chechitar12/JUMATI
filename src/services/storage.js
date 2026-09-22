const USERS='jumati_users', SESSION='jumati_session', PROGRESS='jumati_progress';
export const getUsers=()=>JSON.parse(localStorage.getItem(USERS)||'[]');
export const saveUser=(u)=>{const a=getUsers();a.push(u);localStorage.setItem(USERS,JSON.stringify(a));};
export const login=(user,password)=>{const u=getUsers().find(x=>x.user.toLowerCase()===user.toLowerCase()&&x.password===password);if(u)localStorage.setItem(SESSION,JSON.stringify(u));return u;};
export const logout=()=>localStorage.removeItem(SESSION);
export const session=()=>JSON.parse(localStorage.getItem(SESSION)||'null');
export const getProgress=(user)=>JSON.parse(localStorage.getItem(`${PROGRESS}_${user}`)||'{"stars":0,"completed":[],"mathCorrect":0}');
export const saveProgress=(user,p)=>localStorage.setItem(`${PROGRESS}_${user}`,JSON.stringify(p));
