import {createContext,useCallback,useContext,useEffect,useMemo,useState,type ReactNode} from 'react'
import {useAuth} from './AuthContext'
import {getLicenseStatus} from '../services/licencia.service'
import type{LicenseStatus}from'../types/stage10'
interface Value{license:LicenseStatus|null;loading:boolean;error:boolean;refresh:()=>Promise<void>}
const Context=createContext<Value|null>(null)
export function LicenseProvider({children}:{children:ReactNode}){const{user,demoMode}=useAuth(),[license,setLicense]=useState<LicenseStatus|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState(false);const refresh=useCallback(async()=>{if(!user||demoMode)return;setLoading(true);try{setLicense(await getLicenseStatus());setError(false)}catch{setError(true)}finally{setLoading(false)}},[user,demoMode]);useEffect(()=>{void refresh()},[refresh]);const value=useMemo(()=>({license,loading,error,refresh}),[license,loading,error,refresh]);return<Context.Provider value={value}>{children}</Context.Provider>}
export function useLicense(){const value=useContext(Context);if(!value)throw new Error('useLicense requiere LicenseProvider');return value}
