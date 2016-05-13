# Login

form-data comes from hidden form input. Some fields vary randomly

curl 'https://www.messenger.com/login/password/' 
'origin: https://www.messenger.com' 
'accept-encoding: gzip, deflate' 
'accept-language: en-US,en;q=0.8' 
'upgrade-insecure-requests: 1' 
'user-agent: Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36' 
'content-type: application/x-www-form-urlencoded' 
'accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8' 
'cache-control: max-age=0' 
'authority: www.messenger.com' 
'cookie: datr=LPk1Vxtwqo-q9krvR4Y03Ia9' 
'referer: https://www.messenger.com/?_rdr' 
--data '
lsd=AVrtvsra
initial_request_id=AacLOWVHfZ1UpCQdlomtdO8
timezone=240
lgndim=eyJ3IjoxMjgwLCJoIjo4NTMsImF3IjoxMjgwLCJhaCI6ODUzLCJjIjoyNH0%3D
lgnrnd=085628_nm4-
lgnjs=n
email=<YOUR_EMAIL>
pass=<YOUR_PASSWORD>
login=1
default_persistent=0' --compressed