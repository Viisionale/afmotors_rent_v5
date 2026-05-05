async function run() {
  const res = await fetch('https://afmotors.myrent.it/MyRentWeb/api/v2/onlineUser/registerBookingUser', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'testxyz123@example.com',
      password: 'Test1234!',
      onlineUserType: 'Company',
      onlineUserRole: 'Operator',
      onlineUserStatus: 'active'
    })
  });
  console.log(res.status);
  const text = await res.text();
  console.log(text.substring(0, 500));
}
run();
