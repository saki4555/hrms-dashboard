import { useLocation, matchPath } from 'react-router';



  

export function useActiveNavParent(subItems) {
const location = useLocation();
  console.log("helo")
  return subItems?.some(sub => 
    sub?.url && matchPath({ path: sub.url, end: false }, location.pathname)
  ) ?? false;
}

export function useActiveNavChild(url) {
    const location = useLocation();
    console.log("location name from hook", location.pathname)
    return matchPath({path: url, end: true}, location.pathname)
}