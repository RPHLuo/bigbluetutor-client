import { Component } from '@angular/core';
import { NavController, MenuController } from 'ionic-angular';
import { HomePage } from '../home/home';
import { CreateUsernamePage } from '../createusername/createusername'
import { RoleChoice } from '../onboarding/roleChoice/roleChoice';
import { DsService } from '../../shared/ds.service';
import { GooglePlus } from '@ionic-native/google-plus';
import { TabsPage } from '../tabs/tabs';

@Component({
  selector: 'page-login',
  templateUrl: 'login.html'
})
export class LoginPage {
  username: string;
  password: string;
  idToken: string;
  browser: any;
  constructor(public navCtrl: NavController, public menuCtrl: MenuController, private ds: DsService, private googlePlus: GooglePlus) {
  }

  login() {
    this.ds.login({ username: this.username, password: this.password }, this.handleLogin.bind(this));
  }

  handleLogin(success, data) {
    if(success) {
      this.ds.dsInstance.record.has("profile/"+this.username, this.linkProfile.bind(this));
    }else {
      console.log(success);
    }
  }

  linkProfile(error, hasRecord) {

    var record = this.ds.getRecord("profile/"+this.username);
    if(!hasRecord) {
      record.set({
        username: this.username,
        password: '',
        stars: [],
        pendingMeetings: [],
        requestMeetings: [],
        messages: {},
        profilePic: "http://www.freeiconspng.com/uploads/msn-people-person-profile-user-icon--icon-search-engine-16.png",
        meeting: ""
      });
      this.ds.profileRecord = record;
      this.ds.dataRecord = this.ds.getRecord("data")
      this.ds.dataRecord.whenReady(() => {
        this.goToOnboarding();
      })
    } else {
      this.ds.profileRecord = record;
      this.ds.dataRecord = this.ds.getRecord("data")
      this.ds.dataRecord.whenReady(() => {
        this.goToHome();
      });
    }
  }

  googleLogin()
  {
    this.googleLogout();
    this.googlePlus.login({webClientId: "591220975174-hqfbvf7iuegj6nf1h6jkldeuh3ia72v7.apps.googleusercontent.com", offline: true}).then(res =>
    {
      this.idToken = res.idToken;
      this.ds.login({idToken: this.idToken}, this.handleGoogleLogin.bind(this));
    }).catch(error =>
    {
      console.log("Login error:", error);
    });
  }

  handleGoogleLogin(success, data) {
    console.log("Google login success:", success);
    if(success && data && data.username) {
      this.username = data.username;
      this.ds.dsInstance.record.has("profile/"+this.username, this.linkGoogleProfile.bind(this));
    }
    else if(data && data.needsUsername)
    {
      this.goToCreateUsername();
    }
  }

  linkGoogleProfile(error, hasRecord) {
    if(!hasRecord)
    {
      this.goToCreateUsername();
    }
    else
    {
      this.ds.getRecord("profile/"+this.username).whenReady(profileRecord =>
      {
        this.ds.profileRecord = profileRecord;
        this.ds.getRecord("data").whenReady(dataRecord =>
        {
          this.ds.dataRecord = dataRecord;
          // if(profileRecord.get("onboardingComplete"))
            this.goToHome();
          // else
            // this.goToOnboarding();
        });
      });
    }
  }

  googleLogout()
  {
    if(this.ds.dsInstance) this.ds.dsInstance.close();
    this.googlePlus.disconnect().then(() =>
    {
      console.log("Logged out of Google Account");
    }).catch(error =>
    {
      console.log("Logout error:", error);
    });
  }

  goToCreateUsername()
  {
    this.navCtrl.setRoot(CreateUsernamePage, {idToken: this.idToken});
  }

  goToOnboarding() {
    this.navCtrl.setRoot(RoleChoice);
  }

  goToHome() {
    this.navCtrl.setRoot(TabsPage);
  }

  ionViewWillEnter() {
    this.menuCtrl.swipeEnable( false )
  }
}
