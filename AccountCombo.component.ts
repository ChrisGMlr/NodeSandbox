import { Component, OnInit, Input } from '@angular/core';

import { AccountService }  from '../Account.service';
import { Account_Combo } from '../Account_Combo';

import { Location } from '@angular/common';


@Component({
  selector: 'app-Accounts',
  templateUrl: './AccountCombos.component.html',
  styleUrls: ['./AccountCombos.component.css']
})
export class AccountComboComponent implements OnInit {
  @Input() account_Combo: Account_Combo;


  combo: Account_Combo;
//    {
//    id  =  Math.floor(Math.random() * 10000) + 1
// }
  accountCombos: Account_Combo[] = [];
  constructor(private accountService: AccountService, private location: Location) { }

  public appenv: Array<string> = ['DEV','UAT', 'PROD'];



  ngOnInit() {
    this.getAccountCombos();

    // TODO: send the error to remote logging infrastructure
    console.log("getAccountCombos Run"); // log to console instead
  }
  getAccountCombos(): void {
    this.accountService.getAccountCombos()
      .subscribe(accountCombos => this.accountCombos = accountCombos);

  }

  cloneAccountCombo(id: number): void {
    this.accountService.getAccountCombo(id)
      .subscribe(account_Combo => 
         // shallow clone object
         const newCombo = { ... account_Combo };
         // id changes or whatever
         this.accountService.addAccountCombo(newCombo);
      }); 
  } 

  changeActiveStatus(value): void {

  }


  changedValue(item): void {
    this.accountService.putSearchType(item.value);
  }





}
