import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

import { Observable, of } from 'rxjs';
import { catchError, map, tap, filter } from 'rxjs/operators';
import { Account_Combo } from './Account_Combo';


const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({ providedIn: 'root' })
export class AccountService {

  private AccountsUrl = 'api/Accounts';  // URL to web api
  private SearchType = "";
  private activeStatus = 1;
  constructor(
    private http: HttpClient) { }

    /** PUT Search type  */
    putSearchType (type: string): void {
      this.SearchType = type;
    }

    /** Get Search type  */
    getSearchType (): string {
      try{
        return this.SearchType;
      }
      catch{
        console.log("SearchType was null");
        return "";
      }
    }

    putStatus(value: number): void {
      this.activeStatus = value;
    }

  /** GET Account Combos from the server */
  getAccountCombos (): Observable<Account_Combo[]> {
    return this.http.get<Account_Combo[]>(this.AccountsUrl)
      .pipe(
        catchError(this.handleError('getAccountCombos', []))
      );
  }

  /** GET Account Combo by id. Will 404 if id not found*/
  getAccountCombo(id: number): Observable<Account_Combo> {
    return this.getAccountCombos()
      .pipe(
        map(actCombos as Account_Combo[] => actCombos.filter(ActCombo => ActCombo.id == id)[0]),
        catchError(this.handleError('getAccountCombo', []))
      );
  }


updateAccountCombo (accountCombo: Account_Combo): Observable<any> {
  return this.http.put(this.AccountsUrl, accountCombo, httpOptions).pipe(
    catchError(this.handleError<any>('updateAccountCombo'))
  );
}


addAccountCombo (accountCombo: Account_Combo): Observable<Account_Combo> {
  return this.http.post<Account_Combo>(this.AccountsUrl, accountCombo, httpOptions).pipe(
    catchError(this.handleError<Account_Combo>('addAccountCombo'))

  );
}


  /**
   * Handle Http operation that failed.
   * Let the app continue.
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result*/

  private handleError<T> (operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {

      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // TODO: better job of transforming error for user consumption
      //this.log(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }


}
