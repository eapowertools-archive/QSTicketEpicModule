# QSTicketEpicModule
Qlik Sense Ticket API module for use with Epic Hyperspace implementations

To install the solution, navigate to here: [https://github.com/eapowertools/QSTicketEpicModule/releases/tag/RC1](https://github.com/eapowertools/QSTicketEpicModule/releases/tag/RC1)

##Requirements
- Qlik Sense Enterprise Server 2.2.4 and above
- Epic Hyperspace 2015 (version 8.2)

##Installation
1. Download the installer from here: [QSTicketEpicModule](https://github.com/eapowertools/QSTicketEpicModule/releases/tag/RC1).
2. Run the installer with administrator privileges.    
![1](./doc/img/1.png)
3. At the welcome screen click next.    
![2](./doc/img/2.png)
4. The default installation directory detects where Qlik Sense server is installed and adds an EAPowertools folder to that location.  Click Next to continue with the installation.
![3](./doc/img/3.png)
5. The Statement of Support communicates how to obtain support for the QSTicketEpicModule.  Click Next.  
![4](./doc/img/4.png)
6. The Ready to Install window appears.  Click Install to continue.  
![5](./doc/img/5.png)
7. After installing files, The installer checks for the existence of the epic virtual proxy on the Qlik Sense server.  In addition, the hostname of the server is found for configuring the authentication module.  Click Next.  
![6](./doc/img/6.png)
8. The QS Ticket Epic Module configuration screen appears.  By default, values are added for each configuration option.  
  - __QS Ticket Epic Module Port:__ This is the port the authentication module will run on the server.
  - __Qlik Sense Proxy service port:__ This is the port for the proxy service.  By default the QPS runs on port 4243.
  - __Qlik Sense Proxy Hostname:__ The name of the Qlik Sense server as listed in the Node configuration of the QMC for the server the module is being installed on.  This is the name of the server provided during Qlik Sense server installation.
  - __Qlik Sense Friendly Hostname:__ The name of the Qlik Sense server as it is accessed from the Internet.  This value may be the same as the Proxy Hostname, however, if using a third party certificate from a trusted certificate authority it is likely different and needs to match the name on the certificate.  See Appendix A for more information about using third party certificates with QS Ticket Epic Module.
  - __Allowed-Access-Control-Origin Header:__ This value determines where requests for authentication may originate from.  By default, * means all sites.  For more information about this value, go [here](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS).
  - __user directory:__ The name of the user directory users who will be accessing Qlik Sense through this authentication module are members of.
  - __shared secret:__ The shared secret is a value that corresponds with the key added to the configuration file of the [QlikSenseEpic2015DLL](https://github.com/eapowertools/QlikSenseEpic2015DLL).
  - __handshake:__ The handshake is a value stored inside of Epic Hyperspace in the BI configuration.  
  After confirming the configuration information, Click Next to continue the installation.

![7](./doc/img/7.png)  
9. Confirm the location of the services.conf file in the Qlik Sense site and click Next.  
![8](./doc/img/8.png)  
10. If the virtual proxy does not exist, the install will create a virtual proxy called Epic and confirm creation.  
![9](./doc/img/9.png)  
11. The service dispatcher will be stopped.  
![10](./doc/img/10.png)  
12. And restarted to start the QS Ticket Epic Module.  
![11](./doc/img/11.png)  
13. At this point the installation is complete.  Click Finish to exit the installer.  

##Appendix A
In the event a third party certificate is installed for Qlik Sense communication, it is necessary to use that certificate for QS Ticket Epic Module communication as well.

###Requirements
- A third party certificate file in PEM file format and a private key for the certificate in PEM file format OR
- A third party certificate file in PFX file format with the private key attached to the certificate.

###Instructions

![12](./doc/img/12.png)
1. Navigate to the folder where QS Ticket Epic Module is installed.  
2. Open a text editor as an administrator and then open the file named server.js.  

![13](./doc/img/13.png)  
3. Inside the server.js file, scroll to the section regarding certificates.  Based on the certificate files in possession, comment the first section referencing httpsOptions and the certificate files to be read.  

4. Uncomment the httpsOptions section and appropriate lines for the certificate files that will be used to secure communication to QS Ticket Epic Module.  The format of the path must be in this format: `c:/program files/%pathToMyCerts%/cert.pem` where __%pathToMyCerts%__ is the fully qualified path to the certificate file.  Be certain to use forward slashes when typing in the path.

