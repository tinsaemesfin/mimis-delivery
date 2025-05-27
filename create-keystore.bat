@echo off
echo Creating release keystore...
keytool -genkeypair -v -storetype PKCS12 -keystore android\app\keystore\release.keystore -alias release -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Mimis Delivery, OU=Mobile, O=Mimis, L=City, S=State, C=US" -storepass mimisdelivery123 -keypass mimisdelivery123
echo Keystore created successfully!
pause 