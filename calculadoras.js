const EF = {

    formatCurrency(value){

        return value.toLocaleString("es-ES",{

            style:"currency",

            currency:"EUR",

            minimumFractionDigits:0,

            maximumFractionDigits:0

        });

    },

    formatInput(value,input){

        if(

            input.classList.contains("ef-rate")||

            input.classList.contains("ef-annual-return")||

            input.classList.contains("ef-withdrawal-rate")

        ){

            let clean=value.replace(/[^\d,]/g,"");

            const parts=clean.split(",");

            if(parts.length>2){

                clean=parts[0]+","+parts.slice(1).join("");

            }

            if(parts[1]!==undefined){

                return parts[0]+","+parts[1].slice(0,2);

            }

            return clean;

        }

        const clean=value.replace(/\D/g,"");

        if(!clean){

            return "";

        }

        return clean.replace(/\B(?=(\d{3})+(?!\d))/g,".");

    },

    parse(input){

        let value=input.value.trim();

        if(

            input.classList.contains("ef-rate")||

            input.classList.contains("ef-annual-return")||

            input.classList.contains("ef-withdrawal-rate")

        ){

            value=value.replace(",",".").trim();

        }else{

            value=value.replace(/\./g,"").trim();

        }

        return parseFloat(value);

    },

    compound(capital,monthly,rate,years,frequency){

        let balance=capital;

        const monthsPerPeriod=12/frequency;

        const periodRate=rate/100/frequency;

        const annualData=[{

            year:0,

            invested:capital,

            interest:0,

            balance:capital

        }];

        let totalInterest=0;

        const totalMonths=years*12;

        for(let month=1;month<=totalMonths;month++){

            balance+=monthly;

            if(month%monthsPerPeriod===0){

                const interest=balance*periodRate;

                balance+=interest;

                totalInterest+=interest;

            }

            if(month%12===0){

                const year=month/12;

                const invested=capital+(monthly*month);

                annualData.push({

                    year:year,

                    invested:invested,

                    interest:totalInterest,

                    balance:balance

                });

            }

        }

        return{

            invested:capital+(monthly*totalMonths),

            interest:totalInterest,

            final:balance,

            annualData:annualData

        };

    },

    simple(capital,rate,years){

        const annualInterest=capital*(rate/100);

        const annualData=[];

        for(let year=0;year<=years;year++){

            const interest=annualInterest*year;

            annualData.push({

                year:year,

                invested:capital,

                interest:interest,

                balance:capital+interest

            });

        }

        return{

            invested:capital,

            interest:annualInterest*years,

            final:capital+(annualInterest*years),

            annualData:annualData

        };

    },

    simpleSavings(

        capital,

        contribution,

        rate,

        years,

        frequency

    ){

        const periodsPerYear=frequency;

        const totalPeriods=years*periodsPerYear;

        const periodRate=rate/100/periodsPerYear;

        const annualData=[{

            year:0,

            invested:capital,

            interest:0,

            balance:capital

        }];

        let totalInterest=

            capital*(rate/100)*years;

        let totalInvested=capital;

        for(let period=1;period<=totalPeriods;period++){

            const remainingPeriods=

                totalPeriods-period;

            totalInterest+=

                contribution*

                periodRate*

                remainingPeriods;

            totalInvested+=contribution;

            if(period%periodsPerYear===0){

                const year=period/periodsPerYear;

                annualData.push({

                    year:year,

                    invested:totalInvested,

                    interest:totalInterest,

                    balance:

                        totalInvested+

                        totalInterest

                });

            }

        }

        return{

            invested:totalInvested,

            interest:totalInterest,

            final:totalInvested+totalInterest,

            annualData:annualData

        };

    },

    mortgage(loan,rate,years){

        const monthlyRate=rate/100/12;

        const totalMonths=years*12;

        let monthlyPayment;

        if(monthlyRate===0){

            monthlyPayment=loan/totalMonths;

        }else{

            monthlyPayment=

                loan*

                (

                    monthlyRate*

                    Math.pow(

                        1+monthlyRate,

                        totalMonths

                    )

                )/

                (

                    Math.pow(

                        1+monthlyRate,

                        totalMonths

                    )-1

                );

        }

        let balance=loan;

        let totalInterest=0;

        const annualData=[{

            year:0,

            balance:loan,

            interest:0

        }];

        for(let month=1;month<=totalMonths;month++){

            const interest=balance*monthlyRate;

            const principal=monthlyPayment-interest;

            balance-=principal;

            totalInterest+=interest;

            if(month%12===0){

                const year=month/12;

                annualData.push({

                    year:year,

                    balance:Math.max(balance,0),

                    interest:totalInterest

                });

            }

        }

        return{

            monthlyPayment:monthlyPayment,

            totalInterest:totalInterest,

            totalPaid:loan+totalInterest,

            annualData:annualData

        };

    },

    financialIndependence(

        currentCapital,

        annualExpenses,

        monthlySavings,

        annualReturn,

        withdrawalRate

    ){

        const targetCapital=

            annualExpenses/(withdrawalRate/100);

        const monthlyReturn=

            Math.pow(

                1+annualReturn/100,

                1/12

            )-1;

        let capital=currentCapital;

        let months=0;

        const annualData=[{

            year:0,

            capital:capital,

            target:targetCapital

        }];

        const maxMonths=1200;

        while(

            capital<targetCapital&&

            months<maxMonths

        ){

            capital=

                capital*(1+monthlyReturn)+

                monthlySavings;

            months++;

            if(months%12===0){

                annualData.push({

                    year:months/12,

                    capital:capital,

                    target:targetCapital

                });

            }

        }

        return{

            target:targetCapital,

            years:months/12,

            capital:capital,

            annualData:annualData

        };

    },

    emergencyFund(

        monthlyExpenses,

        coverageMonths,

        currentSavings,

        monthlyContribution

    ){

        const target=

            monthlyExpenses*

            coverageMonths;

        const remaining=

            Math.max(

                target-currentSavings,

                0

            );

        let months=0;

        let capital=currentSavings;

        const annualData=[{

            year:0,

            capital:capital,

            target:target

        }];

        if(remaining>0&&monthlyContribution>0){

            while(

                capital<target&&

                months<1200

            ){

                capital+=monthlyContribution;

                months++;

                if(months%12===0){

                    annualData.push({

                        year:months/12,

                        capital:Math.min(

                            capital,

                            target

                        ),

                        target:target

                    });

                }

            }

            if(

                months%12!==0&&

                months<1200

            ){

                annualData.push({

                    year:months/12,

                    capital:Math.min(

                        capital,

                        target

                    ),

                    target:target

                });

            }

        }

        return{

            target:target,

            remaining:remaining,

            months:months,

            annualData:annualData

        };

    },

    netWorth(

        cash,

        investments,

        realEstate,

        vehicles,

        otherAssets,

        mortgageDebt,

        loans,

        creditDebt,

        otherDebt

    ){

        const totalAssets=

            cash+

            investments+

            realEstate+

            vehicles+

            otherAssets;

        const totalLiabilities=

            mortgageDebt+

            loans+

            creditDebt+

            otherDebt;

        const netWorth=

            totalAssets-

            totalLiabilities;

        return{

            totalAssets:totalAssets,

            totalLiabilities:totalLiabilities,

            netWorth:netWorth

        };

    }

};


function setupSharing(calc,getShareText){

    const feedback=

        calc.querySelector(".ef-share-feedback");

    calc.querySelector(".ef-share-whatsapp")

        .addEventListener("click",function(){

            window.open(

                "https://wa.me/?text="+

                encodeURIComponent(getShareText()),

                "_blank"

            );

        });

    calc.querySelector(".ef-share-telegram")

        .addEventListener("click",function(){

            window.open(

                "https://t.me/share/url?url="+

                encodeURIComponent(window.location.href)+

                "&text="+

                encodeURIComponent(getShareText()),

                "_blank"

            );

        });

    calc.querySelector(".ef-share-facebook")

        .addEventListener("click",function(){

            window.open(

                "https://www.facebook.com/sharer/sharer.php?u="+

                encodeURIComponent(window.location.href),

                "_blank"

            );

        });

    calc.querySelector(".ef-share-x")

        .addEventListener("click",function(){

            window.open(

                "https://twitter.com/intent/tweet?text="+

                encodeURIComponent(getShareText())+

                "&url="+

                encodeURIComponent(window.location.href),

                "_blank"

            );

        });

    calc.querySelector(".ef-share-copy")

        .addEventListener("click",async function(){

            try{

                await navigator.clipboard.writeText(

                    getShareText()

                );

                feedback.textContent=

                    "Resultado copiado al portapapeles.";

            }catch(error){

                feedback.textContent=

                    "No se ha podido copiar el resultado.";

            }

        });

}


function setupInputs(calc){

    calc.querySelectorAll(".ef-input").forEach(input=>{

        if(input.tagName==="SELECT"){

            return;

        }

        input.addEventListener("input",function(){

            const cursorPosition=this.selectionStart;

            const originalLength=this.value.length;

            this.value=EF.formatInput(

                this.value,

                this

            );

            const newLength=this.value.length;

            const newCursorPosition=

                cursorPosition+

                (newLength-originalLength);

            this.setSelectionRange(

                newCursorPosition,

                newCursorPosition

            );

        });

    });

}


function setupReset(calc){

    const reset=

        calc.querySelector(".ef-reset");

    reset.addEventListener("click",function(){

        calc.querySelectorAll("input").forEach(input=>{

            input.value="";

        });

        calc.querySelectorAll("select").forEach(select=>{

            select.selectedIndex=0;

        });

        calc.querySelector(".ef-error")

            .style.display="none";

        calc.querySelector(".ef-results")

            .style.display="none";

        calc.querySelector(".ef-chart")

            .style.display="none";

        calc.querySelector(".ef-share")

            .style.display="none";

        reset.style.display="none";

        if(calc._efChart){

            calc._efChart.destroy();

            calc._efChart=null;

        }

        calc.querySelector(

            ".ef-share-feedback"

        ).textContent="";

    });

}


function createChart(calc,result,datasets){

    const chartCanvas=

        calc.querySelector(".ef-chart-canvas");

    if(calc._efChart){

        calc._efChart.destroy();

    }

    const labels=result.annualData.map(

        item=>item.year

    );

    calc._efChart=new Chart(chartCanvas,{

        type:"line",

        data:{

            labels:labels,

            datasets:datasets

        },

        options:{

            responsive:true,

            maintainAspectRatio:false,

            interaction:{

                mode:"index",

                intersect:false

            },

            plugins:{

                legend:{

                    position:"bottom",

                    labels:{

                        usePointStyle:true,

                        pointStyle:"circle",

                        boxWidth:8,

                        boxHeight:8,

                        padding:20,

                        font:{

                            family:"Nunito Sans"

                        }

                    }

                },

                tooltip:{

                    callbacks:{

                        label:function(context){

                            return context.dataset.label+

                                ": "+

                                EF.formatCurrency(

                                    context.parsed.y

                                );

                        }

                    }

                }

            },

            scales:{

                x:{

                    title:{

                        display:true,

                        text:"Años",

                        font:{

                            family:"Nunito Sans"

                        }

                    },

                    ticks:{

                        font:{

                            family:"Nunito Sans"

                        }

                    }

                },

                y:{

                    beginAtZero:true,

                    ticks:{

                        font:{

                            family:"Nunito Sans"

                        },

                        callback:function(value){

                            return EF.formatCurrency(value);

                        }

                    }

                }

            }

        }

    });

}


function displayResults(calc){

    calc.querySelector(".ef-results")

        .style.display="grid";

    calc.querySelector(".ef-chart")

        .style.display="block";

    calc.querySelector(".ef-share")

        .style.display="block";

    calc.querySelector(".ef-reset")

        .style.display="block";

}


function showError(calc){

    calc.querySelector(".ef-error")

        .textContent=

        "Introduce valores válidos para realizar el cálculo.";

    calc.querySelector(".ef-error")

        .style.display="block";

    calc.querySelector(".ef-results")

        .style.display="none";

    calc.querySelector(".ef-chart")

        .style.display="none";

    calc.querySelector(".ef-share")

        .style.display="none";

    calc.querySelector(".ef-reset")

        .style.display="none";

}


/* ======================================================
   INTERÉS COMPUESTO
====================================================== */

function initCompoundCalculators(){

    document

        .querySelectorAll(".ef-interest-calculator")

        .forEach(calc=>{

            setupInputs(calc);

            setupReset(calc);

            calc.querySelector(".ef-button")

                .addEventListener("click",function(){

                    const capital=EF.parse(

                        calc.querySelector(".ef-capital")

                    );

                    const monthly=EF.parse(

                        calc.querySelector(".ef-monthly")

                    );

                    const rate=EF.parse(

                        calc.querySelector(".ef-rate")

                    );

                    const years=EF.parse(

                        calc.querySelector(".ef-years")

                    );

                    const frequency=parseInt(

                        calc.querySelector(

                            ".ef-frequency"

                        ).value

                    );

                    if(

                        isNaN(capital)||

                        isNaN(monthly)||

                        isNaN(rate)||

                        isNaN(years)||

                        capital<0||

                        monthly<0||

                        rate<0||

                        years<=0

                    ){

                        showError(calc);

                        return;

                    }

                    const result=EF.compound(

                        capital,

                        monthly,

                        rate,

                        years,

                        frequency

                    );

                    calc.querySelector(

                        ".ef-total-invested"

                    ).textContent=

                        EF.formatCurrency(result.invested);

                    calc.querySelector(

                        ".ef-total-interest"

                    ).textContent=

                        EF.formatCurrency(result.interest);

                    calc.querySelector(

                        ".ef-final-balance"

                    ).textContent=

                        EF.formatCurrency(result.final);

                    displayResults(calc);

                    createChart(calc,result,[

                        {

                            label:"Capital aportado",

                            data:result.annualData.map(

                                item=>item.invested

                            ),

                            borderColor:"#8AAE6D",

                            borderWidth:2,

                            pointRadius:0,

                            pointHoverRadius:5,

                            pointHitRadius:12,

                            tension:.25,

                            fill:false

                        },

                        {

                            label:"Intereses generados",

                            data:result.annualData.map(

                                item=>item.interest

                            ),

                            borderColor:"#BC6B4A",

                            borderWidth:2,

                            pointRadius:0,

                            pointHoverRadius:5,

                            pointHitRadius:12,

                            tension:.25,

                            fill:false

                        },

                        {

                            label:"Capital total",

                            data:result.annualData.map(

                                item=>item.balance

                            ),

                            borderColor:"#3E5A3C",

                            borderWidth:3,

                            pointRadius:0,

                            pointHoverRadius:5,

                            pointHitRadius:12,

                            tension:.25,

                            fill:false

                        }

                    ]);

                });

            setupSharing(calc,function(){

                return "He calculado mi interés compuesto: "+

                    calc.querySelector(

                        ".ef-final-balance"

                    ).textContent+".";

            });

        });

}


/* ======================================================
   INTERÉS SIMPLE
====================================================== */

function initSimpleCalculators(){

    document

        .querySelectorAll(".ef-simple-interest-calculator")

        .forEach(calc=>{

            setupInputs(calc);

            setupReset(calc);

            calc.querySelector(".ef-button")

                .addEventListener("click",function(){

                    const capital=EF.parse(

                        calc.querySelector(".ef-capital")

                    );

                    const rate=EF.parse(

                        calc.querySelector(".ef-rate")

                    );

                    const years=EF.parse(

                        calc.querySelector(".ef-years")

                    );

                    if(

                        isNaN(capital)||

                        isNaN(rate)||

                        isNaN(years)||

                        capital<0||

                        rate<0||

                        years<=0

                    ){

                        showError(calc);

                        return;

                    }

                    const result=EF.simple(

                        capital,

                        rate,

                        years

                    );

                    calc.querySelector(

                        ".ef-total-invested"

                    ).textContent=

                        EF.formatCurrency(result.invested);

                    calc.querySelector(

                        ".ef-total-interest"

                    ).textContent=

                        EF.formatCurrency(result.interest);

                    calc.querySelector(

                        ".ef-final-balance"

                    ).textContent=

                        EF.formatCurrency(result.final);

                    displayResults(calc);

                    createChart(calc,result,[

                        {

                            label:"Capital inicial",

                            data:result.annualData.map(

                                item=>item.invested

                            ),

                            borderColor:"#8AAE6D",

                            borderWidth:2,

                            pointRadius:0,

                            pointHoverRadius:5,

                            pointHitRadius:12,

                            tension:.25,

                            fill:false

                        },

                        {

                            label:"Intereses generados",

                            data:result.annualData.map(

                                item=>item.interest

                            ),

                            borderColor:"#BC6B4A",

                            borderWidth:2,

                            pointRadius:0,

                            pointHoverRadius:5,

                            pointHitRadius:12,

                            tension:.25,

                            fill:false

                        },

                        {

                            label:"Capital total",

                            data:result.annualData.map(

                                item=>item.balance

                            ),

                            borderColor:"#3E5A3C",

                            borderWidth:3,

                            pointRadius:0,

                            pointHoverRadius:5,

                            pointHitRadius:12,

                            tension:.25,

                            fill:false

                        }

                    ]);

                });

            setupSharing(calc,function(){

                return "He calculado mi interés simple: "+

                    calc.querySelector(

                        ".ef-final-balance"

                    ).textContent+".";

            });

        });

}


/* ======================================================
   AHORRO CON INTERÉS SIMPLE
====================================================== */

function initSimpleSavingsCalculators(){

    document

        .querySelectorAll(".ef-simple-savings-calculator")

        .forEach(calc=>{

            setupInputs(calc);

            setupReset(calc);

            calc.querySelector(".ef-button")

                .addEventListener("click",function(){

                    const capital=EF.parse(

                        calc.querySelector(".ef-capital")

                    );

                    const contribution=EF.parse(

                        calc.querySelector(

                            ".ef-contribution"

                        )

                    );

                    const rate=EF.parse(

                        calc.querySelector(".ef-rate")

                    );

                    const years=EF.parse(

                        calc.querySelector(".ef-years")

                    );

                    const frequency=parseInt(

                        calc.querySelector(

                            ".ef-frequency"

                        ).value

                    );

                    if(

                        isNaN(capital)||

                        isNaN(contribution)||

                        isNaN(rate)||

                        isNaN(years)||

                        capital<0||

                        contribution<0||

                        rate<0||

                        years<=0

                    ){

                        showError(calc);

                        return;

                    }

                    const result=EF.simpleSavings(

                        capital,

                        contribution,

                        rate,

                        years,

                        frequency

                    );

                    calc.querySelector(

                        ".ef-total-invested"

                    ).textContent=

                        EF.formatCurrency(result.invested);

                    calc.querySelector(

                        ".ef-total-interest"

                    ).textContent=

                        EF.formatCurrency(result.interest);

                    calc.querySelector(

                        ".ef-final-balance"

                    ).textContent=

                        EF.formatCurrency(result.final);

                    displayResults(calc);

                    createChart(calc,result,[

                        {

                            label:"Capital aportado",

                            data:result.annualData.map(

                                item=>item.invested

                            ),

                            borderColor:"#8AAE6D",

                            borderWidth:2,

                            pointRadius:0,

                            pointHoverRadius:5,

                            pointHitRadius:12,

                            tension:.25,

                            fill:false

                        },

                        {

                            label:"Intereses generados",

                            data:result.annualData.map(

                                item=>item.interest

                            ),

                            borderColor:"#BC6B4A",

                            borderWidth:2,

                            pointRadius:0,

                            pointHoverRadius:5,

                            pointHitRadius:12,

                            tension:.25,

                            fill:false

                        },

                        {

                            label:"Capital total",

                            data:result.annualData.map(

                                item=>item.balance

                            ),

                            borderColor:"#3E5A3C",

                            borderWidth:3,

                            pointRadius:0,

                            pointHoverRadius:5,

                            pointHitRadius:12,

                            tension:.25,

                            fill:false

                        }

                    ]);

                });

            setupSharing(calc,function(){

                return "He calculado mi ahorro con interés simple: "+

                    calc.querySelector(

                        ".ef-final-balance"

                    ).textContent+".";

            });

        });

}


/* ======================================================
   HIPOTECA
====================================================== */

function initMortgageCalculators(){

    document

        .querySelectorAll(".ef-mortgage-calculator")

        .forEach(calc=>{

            setupInputs(calc);

            setupReset(calc);

            calc.querySelector(".ef-button")

                .addEventListener("click",function(){

                    const loan=EF.parse(

                        calc.querySelector(".ef-loan")

                    );

                    const rate=EF.parse(

                        calc.querySelector(".ef-rate")

                    );

                    const years=EF.parse(

                        calc.querySelector(".ef-years")

                    );

                    if(

                        isNaN(loan)||

                        isNaN(rate)||

                        isNaN(years)||

                        loan<=0||

                        rate<0||

                        years<=0

                    ){

                        showError(calc);

                        return;

                    }

                    const result=EF.mortgage(

                        loan,

                        rate,

                        years

                    );

                    calc.querySelector(

                        ".ef-monthly-payment"

                    ).textContent=

                        EF.formatCurrency(

                            result.monthlyPayment

                        );

                    calc.querySelector(

                        ".ef-total-interest"

                    ).textContent=

                        EF.formatCurrency(

                            result.totalInterest

                        );

                    calc.querySelector(

                        ".ef-total-paid"

                    ).textContent=

                        EF.formatCurrency(

                            result.totalPaid

                        );

                    displayResults(calc);

                    createChart(calc,result,[

                        {

                            label:"Deuda pendiente",

                            data:result.annualData.map(

                                item=>item.balance

                            ),

                            borderColor:"#3E5A3C",

                            borderWidth:3,

                            pointRadius:0,

                            pointHoverRadius:5,

                            pointHitRadius:12,

                            tension:.25,

                            fill:false

                        },

                        {

                            label:"Intereses acumulados",

                            data:result.annualData.map(

                                item=>item.interest

                            ),

                            borderColor:"#BC6B4A",

                            borderWidth:2,

                            pointRadius:0,

                            pointHoverRadius:5,

                            pointHitRadius:12,

                            tension:.25,

                            fill:false

                        }

                    ]);

                });

            setupSharing(calc,function(){

                return "He calculado mi hipoteca: "+

                    calc.querySelector(

                        ".ef-monthly-payment"

                    ).textContent+".";

            });

        });

}


/* ======================================================
   INDEPENDENCIA FINANCIERA
====================================================== */

function initFinancialIndependenceCalculators(){

    document

        .querySelectorAll(

            ".ef-financial-independence-calculator"

        )

        .forEach(calc=>{

            setupInputs(calc);

            setupReset(calc);

            calc.querySelector(".ef-button")

                .addEventListener("click",function(){

                    const currentCapital=EF.parse(

                        calc.querySelector(

                            ".ef-current-capital"

                        )

                    );

                    const annualExpenses=EF.parse(

                        calc.querySelector(

                            ".ef-annual-expenses"

                        )

                    );

                    const monthlySavings=EF.parse(

                        calc.querySelector(

                            ".ef-monthly-savings"

                        )

                    );

                    const annualReturn=EF.parse(

                        calc.querySelector(

                            ".ef-annual-return"

                        )

                    );

                    const withdrawalRate=EF.parse(

                        calc.querySelector(

                            ".ef-withdrawal-rate"

                        )

                    );

                    if(

                        isNaN(currentCapital)||

                        isNaN(annualExpenses)||

                        isNaN(monthlySavings)||

                        isNaN(annualReturn)||

                        isNaN(withdrawalRate)||

                        currentCapital<0||

                        annualExpenses<=0||

                        monthlySavings<0||

                        annualReturn<0||

                        withdrawalRate<=0

                    ){

                        showError(calc);

                        return;

                    }

                    const result=

                        EF.financialIndependence(

                            currentCapital,

                            annualExpenses,

                            monthlySavings,

                            annualReturn,

                            withdrawalRate

                        );

                    calc.querySelector(

                        ".ef-fi-target"

                    ).textContent=

                        EF.formatCurrency(

                            result.target

                        );

                    calc.querySelector(

                        ".ef-fi-years"

                    ).textContent=

                        result.years.toLocaleString(

                            "es-ES",

                            {

                                minimumFractionDigits:1,

                                maximumFractionDigits:1

                            }

                        )+" años";

                    calc.querySelector(

                        ".ef-fi-savings"

                    ).textContent=

                        EF.formatCurrency(

                            monthlySavings

                        );

                    displayResults(calc);

                    createChart(calc,result,[

                        {

                            label:"Patrimonio acumulado",

                            data:result.annualData.map(

                                item=>item.capital

                            ),

                            borderColor:"#3E5A3C",

                            borderWidth:3,

                            pointRadius:0,

                            pointHoverRadius:5,

                            pointHitRadius:12,

                            tension:.25,

                            fill:false

                        },

                        {

                            label:"Capital objetivo",

                            data:result.annualData.map(

                                item=>item.target

                            ),

                            borderColor:"#BC6B4A",

                            borderWidth:2,

                            pointRadius:0,

                            pointHoverRadius:5,

                            pointHitRadius:12,

                            tension:.25,

                            fill:false

                        }

                    ]);

                });

            setupSharing(calc,function(){

                return "He calculado mi independencia financiera: "+

                    "capital objetivo de "+

                    calc.querySelector(

                        ".ef-fi-target"

                    ).textContent+".";

            });

        });

}


/* ======================================================
   FONDO DE EMERGENCIA
====================================================== */

function initEmergencyFundCalculators(){

    document

        .querySelectorAll(

            ".ef-emergency-fund-calculator"

        )

        .forEach(calc=>{

            setupInputs(calc);

            setupReset(calc);

            calc.querySelector(".ef-button")

                .addEventListener("click",function(){

                    const monthlyExpenses=EF.parse(

                        calc.querySelector(

                            ".ef-monthly-expenses"

                        )

                    );

                    const coverageMonths=EF.parse(

                        calc.querySelector(

                            ".ef-coverage-months"

                        )

                    );

                    const currentSavings=EF.parse(

                        calc.querySelector(

                            ".ef-current-savings"

                        )

                    );

                    const monthlyContribution=EF.parse(

                        calc.querySelector(

                            ".ef-monthly-contribution"

                        )

                    );

                    if(

                        isNaN(monthlyExpenses)||

                        isNaN(coverageMonths)||

                        isNaN(currentSavings)||

                        isNaN(monthlyContribution)||

                        monthlyExpenses<=0||

                        coverageMonths<=0||

                        currentSavings<0||

                        monthlyContribution<0

                    ){

                        showError(calc);

                        return;

                    }

                    const result=EF.emergencyFund(

                        monthlyExpenses,

                        coverageMonths,

                        currentSavings,

                        monthlyContribution

                    );

                    calc.querySelector(

                        ".ef-emergency-target"

                    ).textContent=

                        EF.formatCurrency(

                            result.target

                        );

                    calc.querySelector(

                        ".ef-emergency-remaining"

                    ).textContent=

                        EF.formatCurrency(

                            result.remaining

                        );

                    if(result.remaining===0){

                        calc.querySelector(

                            ".ef-emergency-time"

                        ).textContent=

                            "Objetivo alcanzado";

                    }else if(

                        monthlyContribution===0

                    ){

                        calc.querySelector(

                            ".ef-emergency-time"

                        ).textContent=

                            "—";

                    }else{

                        calc.querySelector(

                            ".ef-emergency-time"

                        ).textContent=

                            result.months+

                            " meses";

                    }

                    displayResults(calc);

                    createChart(calc,result,[

                        {

                            label:"Fondo acumulado",

                            data:result.annualData.map(

                                item=>item.capital

                            ),

                            borderColor:"#3E5A3C",

                            borderWidth:3,

                            pointRadius:0,

                            pointHoverRadius:5,

                            pointHitRadius:12,

                            tension:.25,

                            fill:false

                        },

                        {

                            label:"Fondo recomendado",

                            data:result.annualData.map(

                                item=>item.target

                            ),

                            borderColor:"#BC6B4A",

                            borderWidth:2,

                            pointRadius:0,

                            pointHoverRadius:5,

                            pointHitRadius:12,

                            tension:.25,

                            fill:false

                        }

                    ]);

                });

            setupSharing(calc,function(){

                return "He calculado mi fondo de emergencia: "+

                    "fondo recomendado de "+

                    calc.querySelector(

                        ".ef-emergency-target"

                    ).textContent+

                    " y me faltan "+

                    calc.querySelector(

                        ".ef-emergency-remaining"

                    ).textContent+

                    " para alcanzar el objetivo.";

            });

        });

}


/* ======================================================
   PATRIMONIO NETO
====================================================== */

function initNetWorthCalculators(){

    document

        .querySelectorAll(

            ".ef-net-worth-calculator"

        )

        .forEach(calc=>{

            setupInputs(calc);

            setupReset(calc);

            calc.querySelector(".ef-button")

                .addEventListener("click",function(){

                    const cash=EF.parse(

                        calc.querySelector(

                            ".ef-cash"

                        )

                    );

                    const investments=EF.parse(

                        calc.querySelector(

                            ".ef-investments"

                        )

                    );

                    const realEstate=EF.parse(

                        calc.querySelector(

                            ".ef-real-estate"

                        )

                    );

                    const vehicles=EF.parse(

                        calc.querySelector(

                            ".ef-vehicles"

                        )

                    );

                    const otherAssets=EF.parse(

                        calc.querySelector(

                            ".ef-other-assets"

                        )

                    );

                    const mortgageDebt=EF.parse(

                        calc.querySelector(

                            ".ef-mortgage-debt"

                        )

                    );

                    const loans=EF.parse(

                        calc.querySelector(

                            ".ef-loans"

                        )

                    );

                    const creditDebt=EF.parse(

                        calc.querySelector(

                            ".ef-credit-debt"

                        )

                    );

                    const otherDebt=EF.parse(

                        calc.querySelector(

                            ".ef-other-debt"

                        )

                    );

                    if(

                        isNaN(cash)||

                        isNaN(investments)||

                        isNaN(realEstate)||

                        isNaN(vehicles)||

                        isNaN(otherAssets)||

                        isNaN(mortgageDebt)||

                        isNaN(loans)||

                        isNaN(creditDebt)||

                        isNaN(otherDebt)||

                        cash<0||

                        investments<0||

                        realEstate<0||

                        vehicles<0||

                        otherAssets<0||

                        mortgageDebt<0||

                        loans<0||

                        creditDebt<0||

                        otherDebt<0

                    ){

                        showError(calc);

                        return;

                    }

                    const result=EF.netWorth(

                        cash,

                        investments,

                        realEstate,

                        vehicles,

                        otherAssets,

                        mortgageDebt,

                        loans,

                        creditDebt,

                        otherDebt

                    );

                    calc.querySelector(

                        ".ef-net-worth"

                    ).textContent=

                        EF.formatCurrency(

                            result.netWorth

                        );

                    calc.querySelector(

                        ".ef-total-assets"

                    ).textContent=

                        EF.formatCurrency(

                            result.totalAssets

                        );

                    calc.querySelector(

                        ".ef-total-liabilities"

                    ).textContent=

                        EF.formatCurrency(

                            result.totalLiabilities

                        );

                    displayResults(calc);

                    createNetWorthChart(

                        calc,

                        result

                    );

                });

            setupSharing(calc,function(){

                return "He calculado mi patrimonio neto: "+

                    calc.querySelector(

                        ".ef-net-worth"

                    ).textContent+".";

            });

        });

}


/* ======================================================
   GRÁFICO PATRIMONIO NETO
====================================================== */

function createNetWorthChart(calc,result){

    const chartCanvas=

        calc.querySelector(".ef-chart-canvas");

    if(calc._efChart){

        calc._efChart.destroy();

    }

    calc._efChart=new Chart(chartCanvas,{

        type:"bar",

        data:{

            labels:[

                "Activos",

                "Pasivos",

                "Patrimonio neto"

            ],

            datasets:[

                {

                    label:"Importe",

                    data:[

                        result.totalAssets,

                        result.totalLiabilities,

                        result.netWorth

                    ],

                    backgroundColor:[

                        "#8AAE6D",

                        "#BC6B4A",

                        "#3E5A3C"

                    ],

                    borderWidth:0,

                    borderRadius:8

                }

            ]

        },

        options:{

            responsive:true,

            maintainAspectRatio:false,

            plugins:{

                legend:{

                    display:false

                },

                tooltip:{

                    callbacks:{

                        label:function(context){

                            return EF.formatCurrency(

                                context.parsed.y

                            );

                        }

                    }

                }

            },

            scales:{

                x:{

                    ticks:{

                        font:{

                            family:"Nunito Sans"

                        }

                    }

                },

                y:{

                    beginAtZero:true,

                    ticks:{

                        font:{

                            family:"Nunito Sans"

                        },

                        callback:function(value){

                            return EF.formatCurrency(

                                value

                            );

                        }

                    }

                }

            }

        }

    });

}


/* ======================================================
   INICIALIZACIÓN GENERAL
====================================================== */

function initEF(){

    initCompoundCalculators();

    initSimpleCalculators();

    initSimpleSavingsCalculators();

    initMortgageCalculators();

    initFinancialIndependenceCalculators();

    initEmergencyFundCalculators();

    initNetWorthCalculators();

}


if(document.readyState==="loading"){

    document.addEventListener(

        "DOMContentLoaded",

        initEF

    );

}else{

    initEF();

}
