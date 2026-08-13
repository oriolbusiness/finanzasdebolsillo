const EF = {

    formatCurrency(value){

        return value.toLocaleString("es-ES",{

            style:"currency",

            currency:"EUR",

            minimumFractionDigits:0,

            maximumFractionDigits:2

        });

    },

    formatInput(value,input){

        if(
            input.classList.contains("ef-rate")||
            input.classList.contains("ef-annual-return")||
            input.classList.contains("ef-withdrawal-rate")||
            input.classList.contains("ef-inflation")||
            input.classList.contains("ef-vat-rate")
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

        /*
         * IMPORTES
         *
         * Permite:
         * 1.000
         * 1.000,50
         * 1000,50
         */

        let clean=value.replace(/[^\d,]/g,"");

        const parts=clean.split(",");

        if(parts.length>2){

            clean=parts[0]+","+parts.slice(1).join("");

        }

        if(parts[1]!==undefined){

            let integerPart=parts[0];

            let decimalPart=parts[1].slice(0,2);

            if(integerPart){

                integerPart=integerPart.replace(
                    /\B(?=(\d{3})+(?!\d))/g,
                    "."
                );

            }

            return integerPart+","+decimalPart;

        }

        if(!clean){

            return "";

        }

        return clean.replace(
            /\B(?=(\d{3})+(?!\d))/g,
            "."
        );

    },

    parse(input){

        let value=input.value.trim();

        if(
            input.classList.contains("ef-rate")||
            input.classList.contains("ef-annual-return")||
            input.classList.contains("ef-withdrawal-rate")||
            input.classList.contains("ef-inflation")||
            input.classList.contains("ef-vat-rate")
        ){

            value=value.replace(",",".").trim();

        }else{

            value=value
                .replace(/\./g,"")
                .replace(",",".")
                .trim();

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

        for(
            let period=1;
            period<=totalPeriods;
            period++
        ){

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

        for(
            let month=1;
            month<=totalMonths;
            month++
        ){

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

        if(
            remaining>0&&
            monthlyContribution>0
        ){

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

    loanAmortization(loan,rate,years){

        return this.mortgage(loan,rate,years);

    },

    retirement(
        currentAge,
        retirementAge,
        currentCapital,
        monthlyContribution,
        annualReturn,
        inflation,
        retirementIncome,
        withdrawalRate
    ){

        const years=retirementAge-currentAge;
        const months=years*12;
        const monthlyReturn=
            Math.pow(1+(annualReturn/100),1/12)-1;
        const inflationFactor=
            Math.pow(1+(inflation/100),years);
        const requiredCapital=
            (retirementIncome*12*inflationFactor)/
            (withdrawalRate/100);
        let balance=currentCapital;
        let invested=currentCapital;
        let interest=0;
        const annualData=[{
            year:0,
            balance:balance,
            required:requiredCapital,
            invested:invested,
            interest:interest
        }];

        for(let month=1;month<=months;month++){

            const earned=balance*monthlyReturn;

            balance+=earned+monthlyContribution;
            invested+=monthlyContribution;
            interest+=earned;

            if(month%12===0){

                annualData.push({
                    year:month/12,
                    balance:balance,
                    required:requiredCapital,
                    invested:invested,
                    interest:interest
                });

            }

        }

        return{
            years:years,
            final:balance,
            requiredCapital:requiredCapital,
            gap:balance-requiredCapital,
            estimatedIncome:(balance*(withdrawalRate/100))/12,
            annualData:annualData
        };

    },

    roi(initialInvestment,revenue,associatedCosts){

        const finalValue=revenue-associatedCosts;
        const netProfit=finalValue-initialInvestment;

        return{
            initialInvestment:initialInvestment,
            revenue:revenue,
            associatedCosts:associatedCosts,
            finalValue:finalValue,
            netProfit:netProfit,
            roi:(netProfit/initialInvestment)*100,
            annualData:[
                {year:0,investment:initialInvestment,value:initialInvestment},
                {year:1,investment:initialInvestment,value:finalValue}
            ]
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
            cash+investments+realEstate+vehicles+otherAssets;
        const totalLiabilities=
            mortgageDebt+loans+creditDebt+otherDebt;

        return{
            totalAssets:totalAssets,
            totalLiabilities:totalLiabilities,
            netWorth:totalAssets-totalLiabilities,
            annualData:[
                {
                    year:0,
                    assets:totalAssets,
                    liabilities:totalLiabilities,
                    netWorth:totalAssets-totalLiabilities
                }
            ]
        };

    },

    inflation(amount,rate,years){

        const annualData=[];
        const inflationFactor=
            Math.pow(1+(rate/100),years);

        for(let year=0;year<=years;year++){

            const futureCost=
                amount*Math.pow(1+(rate/100),year);

            annualData.push({
                year:year,
                currentValue:amount,
                futureCost:futureCost
            });

        }

        const futureCost=
            amount*inflationFactor;

        return{
            futureCost:futureCost,
            equivalentValue:amount/inflationFactor,
            purchasingPower:100/inflationFactor,
            extraAmount:futureCost-amount,
            annualData:annualData
        };

    },

    monthlySavings(income,expenses){

        const savings=income-expenses;
        const savingsRate=(savings/income)*100;
        const expensesRate=(expenses/income)*100;

        return{
            savings:savings,
            savingsRate:savingsRate,
            expensesRate:expensesRate,
            annualData:[
                {year:"Ingresos",amount:income},
                {year:"Gastos",amount:expenses},
                {year:"Ahorro",amount:savings}
            ]
        };

    },

    /*
     * ==================================================
     * CALCULADORA DE IVA
     * ==================================================
     */

    vatAdd(amount,rate){

        const vat=
            amount*(rate/100);

        const total=
            amount+vat;

        return{

            base:amount,

            vat:vat,

            total:total

        };

    },

    vatRemove(total,rate){

        const base=
            total/(1+(rate/100));

        const vat=
            total-base;

        return{

            base:base,

            vat:vat,

            total:total

        };

    },

    vatFromAmount(vat,rate){

        const base=
            vat/(rate/100);

        const total=
            base+vat;

        return{

            base:base,

            vat:vat,

            total:total

        };

    }

};


/* ======================================================
   COMPARTIR
====================================================== */

function setupSharing(calc,getShareText){

    const feedback=
        calc.querySelector(".ef-share-feedback");

    const whatsapp=
        calc.querySelector(".ef-share-whatsapp");

    const telegram=
        calc.querySelector(".ef-share-telegram");

    const facebook=
        calc.querySelector(".ef-share-facebook");

    const x=
        calc.querySelector(".ef-share-x");

    const copy=
        calc.querySelector(".ef-share-copy");

    if(whatsapp){

        whatsapp.addEventListener("click",function(){

            window.open(
                "https://wa.me/?text="+
                encodeURIComponent(getShareText()),
                "_blank"
            );

        });

    }

    if(telegram){

        telegram.addEventListener("click",function(){

            window.open(
                "https://t.me/share/url?url="+
                encodeURIComponent(window.location.href)+
                "&text="+
                encodeURIComponent(getShareText()),
                "_blank"
            );

        });

    }

    if(facebook){

        facebook.addEventListener("click",function(){

            window.open(
                "https://www.facebook.com/sharer/sharer.php?u="+
                encodeURIComponent(window.location.href),
                "_blank"
            );

        });

    }

    if(x){

        x.addEventListener("click",function(){

            window.open(
                "https://twitter.com/intent/tweet?text="+
                encodeURIComponent(getShareText())+
                "&url="+
                encodeURIComponent(window.location.href),
                "_blank"
            );

        });

    }

    if(copy){

        copy.addEventListener("click",async function(){

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

}


/* ======================================================
   INPUTS
====================================================== */

function setupInputs(calc){

    calc.querySelectorAll(".ef-input").forEach(input=>{

        if(input.tagName==="SELECT"){

            return;

        }

        input.addEventListener("input",function(){

            const cursorPosition=
                this.selectionStart;

            const originalLength=
                this.value.length;

            this.value=
                EF.formatInput(
                    this.value,
                    this
                );

            const newLength=
                this.value.length;

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


/* ======================================================
   RESET
====================================================== */

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

        const chart=
            calc.querySelector(".ef-chart");

        if(chart){

            chart.style.display="none";

        }

        calc.querySelector(".ef-share")
            .style.display="none";

        reset.style.display="none";

        if(calc._efChart){

            calc._efChart.destroy();

            calc._efChart=null;

        }

        const feedback=
            calc.querySelector(
                ".ef-share-feedback"
            );

        if(feedback){

            feedback.textContent="";

        }

    });

}


/* ======================================================
   GRÁFICOS
====================================================== */

function createChart(calc,result,datasets){

    const chartCanvas=
        calc.querySelector(".ef-chart-canvas");

    if(!chartCanvas){

        return;

    }

    if(calc._efChart){

        calc._efChart.destroy();

    }

    const labels=
        result.annualData.map(item=>item.year);

    calc._efChart=
        new Chart(
            chartCanvas,
            {

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

                                },

                                callback:function(value){

                                    const label=
                                        this.getLabelForValue(
                                            value
                                        );

                                    const number=
                                        parseFloat(label);

                                    if(isNaN(number)){

                                        return label;

                                    }

                                    return number.toLocaleString(
                                        "es-ES",
                                        {
                                            minimumFractionDigits:0,
                                            maximumFractionDigits:2
                                        }
                                    );

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

            }
        );

}


/* ======================================================
   GRÁFICO CIRCULAR
====================================================== */

function createDoughnutChart(calc,labels,data,colors){

    const chartCanvas=
        calc.querySelector(".ef-chart-canvas");

    if(!chartCanvas){

        return;

    }

    if(calc._efChart){

        calc._efChart.destroy();

    }

    calc._efChart=
        new Chart(chartCanvas,{

            type:"doughnut",

            data:{

                labels:labels,

                datasets:[{

                    data:data,
                    backgroundColor:colors,
                    borderColor:"#FFFFFF",
                    borderWidth:3,
                    hoverOffset:8

                }]

            },

            options:{

                responsive:true,
                maintainAspectRatio:false,
                cutout:"62%",

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

                                return context.label+": "+
                                    EF.formatCurrency(context.parsed);

                            }

                        }

                    }

                }

            }

        });

}


/* ======================================================
   MOSTRAR RESULTADOS
====================================================== */

function displayResults(calc){

    calc.querySelector(".ef-results")
        .style.display="grid";

    const chart=
        calc.querySelector(".ef-chart");

    if(chart){

        chart.style.display="block";

    }

    const share=
        calc.querySelector(".ef-share");

    if(share){

        share.style.display="block";

    }

    calc.querySelector(".ef-reset")
        .style.display="block";

}


/* ======================================================
   ERROR
====================================================== */

function showError(calc){

    const error=
        calc.querySelector(".ef-error");

    error.textContent=
        "Introduce valores válidos para realizar el cálculo.";

    error.style.display="block";

    calc.querySelector(".ef-results")
        .style.display="none";

    const chart=
        calc.querySelector(".ef-chart");

    if(chart){

        chart.style.display="none";

    }

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

                    const capital=
                        EF.parse(
                            calc.querySelector(".ef-capital")
                        );

                    const monthly=
                        EF.parse(
                            calc.querySelector(".ef-monthly")
                        );

                    const rate=
                        EF.parse(
                            calc.querySelector(".ef-rate")
                        );

                    const years=
                        EF.parse(
                            calc.querySelector(".ef-years")
                        );

                    const frequency=
                        parseInt(
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

                    const result=
                        EF.compound(
                            capital,
                            monthly,
                            rate,
                            years,
                            frequency
                        );

                    calc.querySelector(
                        ".ef-total-invested"
                    ).textContent=
                        EF.formatCurrency(
                            result.invested
                        );

                    calc.querySelector(
                        ".ef-total-interest"
                    ).textContent=
                        EF.formatCurrency(
                            result.interest
                        );

                    calc.querySelector(
                        ".ef-final-balance"
                    ).textContent=
                        EF.formatCurrency(
                            result.final
                        );

                    displayResults(calc);

                    createChart(calc,result,[

                        {

                            label:"Capital aportado",

                            data:
                                result.annualData.map(
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

                            data:
                                result.annualData.map(
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

                            data:
                                result.annualData.map(
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
        .querySelectorAll(
            ".ef-simple-interest-calculator"
        )
        .forEach(calc=>{

            setupInputs(calc);

            setupReset(calc);

            calc.querySelector(".ef-button")
                .addEventListener("click",function(){

                    const capital=
                        EF.parse(
                            calc.querySelector(".ef-capital")
                        );

                    const rate=
                        EF.parse(
                            calc.querySelector(".ef-rate")
                        );

                    const years=
                        EF.parse(
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

                    const result=
                        EF.simple(
                            capital,
                            rate,
                            years
                        );

                    calc.querySelector(
                        ".ef-total-invested"
                    ).textContent=
                        EF.formatCurrency(
                            result.invested
                        );

                    calc.querySelector(
                        ".ef-total-interest"
                    ).textContent=
                        EF.formatCurrency(
                            result.interest
                        );

                    calc.querySelector(
                        ".ef-final-balance"
                    ).textContent=
                        EF.formatCurrency(
                            result.final
                        );

                    displayResults(calc);

                    createChart(calc,result,[

                        {

                            label:"Capital inicial",

                            data:
                                result.annualData.map(
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

                            data:
                                result.annualData.map(
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

                            data:
                                result.annualData.map(
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
        .querySelectorAll(
            ".ef-simple-savings-calculator"
        )
        .forEach(calc=>{

            setupInputs(calc);

            setupReset(calc);

            calc.querySelector(".ef-button")
                .addEventListener("click",function(){

                    const capital=
                        EF.parse(
                            calc.querySelector(".ef-capital")
                        );

                    const contribution=
                        EF.parse(
                            calc.querySelector(
                                ".ef-contribution"
                            )
                        );

                    const rate=
                        EF.parse(
                            calc.querySelector(".ef-rate")
                        );

                    const years=
                        EF.parse(
                            calc.querySelector(".ef-years")
                        );

                    const frequency=
                        parseInt(
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

                    const result=
                        EF.simpleSavings(
                            capital,
                            contribution,
                            rate,
                            years,
                            frequency
                        );

                    calc.querySelector(
                        ".ef-total-invested"
                    ).textContent=
                        EF.formatCurrency(
                            result.invested
                        );

                    calc.querySelector(
                        ".ef-total-interest"
                    ).textContent=
                        EF.formatCurrency(
                            result.interest
                        );

                    calc.querySelector(
                        ".ef-final-balance"
                    ).textContent=
                        EF.formatCurrency(
                            result.final
                        );

                    displayResults(calc);

                    createChart(calc,result,[

                        {

                            label:"Capital aportado",

                            data:
                                result.annualData.map(
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

                            data:
                                result.annualData.map(
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

                            data:
                                result.annualData.map(
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
        .querySelectorAll(
            ".ef-mortgage-calculator"
        )
        .forEach(calc=>{

            setupInputs(calc);

            setupReset(calc);

            calc.querySelector(".ef-button")
                .addEventListener("click",function(){

                    const loan=
                        EF.parse(
                            calc.querySelector(".ef-loan")
                        );

                    const rate=
                        EF.parse(
                            calc.querySelector(".ef-rate")
                        );

                    const years=
                        EF.parse(
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

                    const result=
                        EF.mortgage(
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

                            data:
                                result.annualData.map(
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

                            data:
                                result.annualData.map(
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

                    const currentCapital=
                        EF.parse(
                            calc.querySelector(
                                ".ef-current-capital"
                            )
                        );

                    const annualExpenses=
                        EF.parse(
                            calc.querySelector(
                                ".ef-annual-expenses"
                            )
                        );

                    const monthlySavings=
                        EF.parse(
                            calc.querySelector(
                                ".ef-monthly-savings"
                            )
                        );

                    const annualReturn=
                        EF.parse(
                            calc.querySelector(
                                ".ef-annual-return"
                            )
                        );

                    const withdrawalRate=
                        EF.parse(
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

                            data:
                                result.annualData.map(
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

                            data:
                                result.annualData.map(
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

                    const monthlyExpenses=
                        EF.parse(
                            calc.querySelector(
                                ".ef-monthly-expenses"
                            )
                        );

                    const coverageMonths=
                        EF.parse(
                            calc.querySelector(
                                ".ef-coverage-months"
                            )
                        );

                    const currentSavings=
                        EF.parse(
                            calc.querySelector(
                                ".ef-current-savings"
                            )
                        );

                    const monthlyContribution=
                        EF.parse(
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

                    const result=
                        EF.emergencyFund(
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

                            data:
                                result.annualData.map(
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

                            data:
                                result.annualData.map(
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
   CALCULADORA DE IVA
====================================================== */

function initRetirementCalculators(){

    document.querySelectorAll(".ef-retirement-calculator")
        .forEach(calc=>{

            setupInputs(calc);
            setupReset(calc);

            calc.querySelector(".ef-button")
                .addEventListener("click",function(){

                    const currentAge=EF.parse(calc.querySelector(".ef-current-age"));
                    const retirementAge=EF.parse(calc.querySelector(".ef-retirement-age"));
                    const currentCapital=EF.parse(calc.querySelector(".ef-current-capital"));
                    const monthlyContribution=EF.parse(calc.querySelector(".ef-monthly-contribution"));
                    const annualReturn=EF.parse(calc.querySelector(".ef-annual-return"));
                    const inflation=EF.parse(calc.querySelector(".ef-inflation"));
                    const retirementIncome=EF.parse(calc.querySelector(".ef-retirement-income"));
                    const withdrawalRate=EF.parse(calc.querySelector(".ef-withdrawal-rate"));

                    if(
                        isNaN(currentAge)||isNaN(retirementAge)||
                        isNaN(currentCapital)||isNaN(monthlyContribution)||
                        isNaN(annualReturn)||isNaN(inflation)||
                        isNaN(retirementIncome)||isNaN(withdrawalRate)||
                        currentAge<0||retirementAge<=currentAge||
                        currentCapital<0||monthlyContribution<0||
                        annualReturn<0||inflation<0||retirementIncome<=0||
                        withdrawalRate<=0
                    ){
                        showError(calc);
                        return;
                    }

                    const result=EF.retirement(
                        currentAge,retirementAge,currentCapital,
                        monthlyContribution,annualReturn,inflation,
                        retirementIncome,withdrawalRate
                    );

                    calc.querySelector(".ef-retirement-capital").textContent=
                        EF.formatCurrency(result.final);
                    calc.querySelector(".ef-required-capital").textContent=
                        EF.formatCurrency(result.requiredCapital);
                    calc.querySelector(".ef-capital-gap").textContent=
                        EF.formatCurrency(result.gap);
                    calc.querySelector(".ef-estimated-income").textContent=
                        EF.formatCurrency(result.estimatedIncome);
                    calc.querySelector(".ef-years-to-retirement").textContent=
                        result.years.toLocaleString("es-ES",{
                            minimumFractionDigits:0,
                            maximumFractionDigits:2
                        })+" años";

                    displayResults(calc);
                    createChart(calc,result,[
                        {
                            label:"Capital estimado",
                            data:result.annualData.map(item=>item.balance),
                            borderColor:"#3E5A3C",borderWidth:3,
                            pointRadius:0,pointHoverRadius:5,
                            pointHitRadius:12,tension:.25,fill:false
                        },
                        {
                            label:"Capital necesario",
                            data:result.annualData.map(item=>item.required),
                            borderColor:"#BC6B4A",borderWidth:2,
                            pointRadius:0,pointHoverRadius:5,
                            pointHitRadius:12,tension:.25,fill:false
                        }
                    ]);
                });

            setupSharing(calc,function(){
                return "He calculado mi jubilación: capital estimado de "+
                    calc.querySelector(".ef-retirement-capital").textContent+
                    ".";
            });
        });
}

function initLoanAmortizationCalculators(){

    document.querySelectorAll(".ef-loan-amortization-calculator")
        .forEach(calc=>{

            setupInputs(calc);
            setupReset(calc);

            calc.querySelector(".ef-button")
                .addEventListener("click",function(){

                    const loan=EF.parse(calc.querySelector(".ef-loan"));
                    const rate=EF.parse(calc.querySelector(".ef-rate"));
                    const years=EF.parse(calc.querySelector(".ef-years"));

                    if(isNaN(loan)||isNaN(rate)||isNaN(years)||
                        loan<=0||rate<0||years<=0){
                        showError(calc);
                        return;
                    }

                    const result=EF.loanAmortization(loan,rate,years);

                    calc.querySelector(".ef-monthly-payment").textContent=
                        EF.formatCurrency(result.monthlyPayment);
                    calc.querySelector(".ef-total-interest").textContent=
                        EF.formatCurrency(result.totalInterest);
                    calc.querySelector(".ef-total-paid").textContent=
                        EF.formatCurrency(result.totalPaid);

                    displayResults(calc);
                    createChart(calc,result,[
                        {
                            label:"Deuda pendiente",
                            data:result.annualData.map(item=>item.balance),
                            borderColor:"#3E5A3C",borderWidth:3,
                            pointRadius:0,pointHoverRadius:5,
                            pointHitRadius:12,tension:.25,fill:false
                        },
                        {
                            label:"Intereses acumulados",
                            data:result.annualData.map(item=>item.interest),
                            borderColor:"#BC6B4A",borderWidth:2,
                            pointRadius:0,pointHoverRadius:5,
                            pointHitRadius:12,tension:.25,fill:false
                        }
                    ]);
                });

            setupSharing(calc,function(){
                return "He calculado la amortización de mi préstamo: cuota mensual de "+
                    calc.querySelector(".ef-monthly-payment").textContent+".";
            });
        });
}

function initROICalculators(){

    document.querySelectorAll(".ef-roi-calculator")
        .forEach(calc=>{

            setupInputs(calc);
            setupReset(calc);

            calc.querySelector(".ef-button")
                .addEventListener("click",function(){

                    const initialInvestment=EF.parse(calc.querySelector(".ef-initial-investment"));
                    const revenue=EF.parse(calc.querySelector(".ef-revenue"));
                    const associatedCosts=EF.parse(calc.querySelector(".ef-associated-costs"));

                    if(isNaN(initialInvestment)||isNaN(revenue)||isNaN(associatedCosts)||
                        initialInvestment<=0||revenue<0||associatedCosts<0){
                        showError(calc);
                        return;
                    }

                    const result=EF.roi(
                        initialInvestment,revenue,associatedCosts
                    );

                    calc.querySelector(".ef-roi").textContent=
                        result.roi.toLocaleString("es-ES",{
                            minimumFractionDigits:0,
                            maximumFractionDigits:2
                        })+" %";
                    calc.querySelector(".ef-net-profit").textContent=
                        EF.formatCurrency(result.netProfit);
                    calc.querySelector(".ef-final-value").textContent=
                        EF.formatCurrency(result.finalValue);

                    displayResults(calc);
                    createChart(calc,result,[
                        {
                            label:"Inversión inicial",
                            data:result.annualData.map(item=>item.investment),
                            borderColor:"#BC6B4A",borderWidth:2,
                            pointRadius:0,pointHoverRadius:5,
                            pointHitRadius:12,tension:.25,fill:false
                        },
                        {
                            label:"Valor final",
                            data:result.annualData.map(item=>item.value),
                            borderColor:"#3E5A3C",borderWidth:3,
                            pointRadius:0,pointHoverRadius:5,
                            pointHitRadius:12,tension:.25,fill:false
                        }
                    ]);
                });

            setupSharing(calc,function(){
                return "He calculado el ROI de mi inversión: "+
                    calc.querySelector(".ef-roi").textContent+".";
            });
        });
}

function initNetWorthCalculators(){

    document.querySelectorAll(".ef-net-worth-calculator")
        .forEach(calc=>{

            setupInputs(calc);
            setupReset(calc);

            calc.querySelector(".ef-button")
                .addEventListener("click",function(){

                    const values=[
                        ".ef-cash",".ef-investments",".ef-real-estate",
                        ".ef-vehicles",".ef-other-assets",".ef-mortgage-debt",
                        ".ef-loans",".ef-credit-debt",".ef-other-debt"
                    ].map(selector=>EF.parse(calc.querySelector(selector)));

                    if(values.some(value=>isNaN(value)||value<0)){
                        showError(calc);
                        return;
                    }

                    const result=EF.netWorth(...values);

                    calc.querySelector(".ef-total-assets").textContent=
                        EF.formatCurrency(result.totalAssets);
                    calc.querySelector(".ef-total-liabilities").textContent=
                        EF.formatCurrency(result.totalLiabilities);
                    calc.querySelector(".ef-net-worth").textContent=
                        EF.formatCurrency(result.netWorth);

                    displayResults(calc);
                    createDoughnutChart(
                        calc,
                        [
                            "Activos totales",
                            "Pasivos totales",
                            result.netWorth>=0
                                ?"Patrimonio neto"
                                :"Patrimonio neto negativo"
                        ],
                        [
                            result.totalAssets,
                            result.totalLiabilities,
                            Math.abs(result.netWorth)
                        ],
                        ["#3E5A3C","#BC6B4A","#3B82F6"]
                    );
                });

            setupSharing(calc,function(){
                return "He calculado mi patrimonio neto: "+
                    calc.querySelector(".ef-net-worth").textContent+".";
            });
        });
}

function initMonthlySavingsCalculators(){

    document.querySelectorAll(".ef-monthly-savings-calculator")
        .forEach(calc=>{

            setupInputs(calc);
            setupReset(calc);

            calc.querySelector(".ef-button")
                .addEventListener("click",function(){

                    const income=
                        EF.parse(calc.querySelector(".ef-monthly-income"));
                    const expenses=
                        EF.parse(calc.querySelector(".ef-monthly-expenses"));

                    if(
                        isNaN(income)||isNaN(expenses)||
                        income<=0||expenses<0
                    ){
                        showError(calc);
                        return;
                    }

                    const result=EF.monthlySavings(income,expenses);

                    calc.querySelector(".ef-monthly-savings-result").textContent=
                        EF.formatCurrency(result.savings);
                    calc.querySelector(".ef-savings-rate-result").textContent=
                        result.savingsRate.toLocaleString("es-ES",{
                            minimumFractionDigits:0,
                            maximumFractionDigits:2
                        })+" %";
                    calc.querySelector(".ef-expenses-rate-result").textContent=
                        result.expensesRate.toLocaleString("es-ES",{
                            minimumFractionDigits:0,
                            maximumFractionDigits:2
                        })+" %";

                    displayResults(calc);
                    createChart(calc,result,[
                        {
                            label:"Importe mensual",
                            data:result.annualData.map(item=>item.amount),
                            borderColor:"#3E5A3C",borderWidth:3,
                            pointRadius:4,pointHoverRadius:5,
                            pointHitRadius:12,tension:.25,fill:false
                        }
                    ]);
                });

            setupSharing(calc,function(){
                return "He calculado mi ahorro mensual: "+
                    calc.querySelector(".ef-monthly-savings-result").textContent+
                    ", equivalente al "+
                    calc.querySelector(".ef-savings-rate-result").textContent+
                    " de mis ingresos.";
            });
        });
}

function initInflationCalculators(){

    document.querySelectorAll(".ef-inflation-calculator")
        .forEach(calc=>{

            setupInputs(calc);
            setupReset(calc);

            calc.querySelector(".ef-button")
                .addEventListener("click",function(){

                    const amount=
                        EF.parse(calc.querySelector(".ef-inflation-amount"));
                    const rate=
                        EF.parse(calc.querySelector(".ef-inflation-rate"));
                    const years=
                        EF.parse(calc.querySelector(".ef-inflation-years"));

                    if(
                        isNaN(amount)||isNaN(rate)||isNaN(years)||
                        amount<0||rate<0||years<=0
                    ){
                        showError(calc);
                        return;
                    }

                    const result=EF.inflation(amount,rate,years);

                    calc.querySelector(".ef-equivalent-value").textContent=
                        EF.formatCurrency(result.equivalentValue);
                    calc.querySelector(".ef-future-cost").textContent=
                        EF.formatCurrency(result.futureCost);
                    calc.querySelector(".ef-extra-amount").textContent=
                        EF.formatCurrency(result.extraAmount);

                    displayResults(calc);
                    createChart(calc,result,[
                        {
                            label:"Importe actual",
                            data:result.annualData.map(item=>item.currentValue),
                            borderColor:"#3E5A3C",borderWidth:2,
                            pointRadius:0,pointHoverRadius:5,
                            pointHitRadius:12,tension:.25,fill:false
                        },
                        {
                            label:"Coste equivalente",
                            data:result.annualData.map(item=>item.futureCost),
                            borderColor:"#BC6B4A",borderWidth:3,
                            pointRadius:0,pointHoverRadius:5,
                            pointHitRadius:12,tension:.25,fill:false
                        }
                    ]);
                });

            setupSharing(calc,function(){
                return "He calculado el efecto de la inflación: un importe actual de "+
                    calc.querySelector(".ef-inflation-amount").value+
                    " tendrá un valor equivalente de "+
                    calc.querySelector(".ef-equivalent-value").textContent+".";
            });
        });
}

function initVATCalculators(){

    document
        .querySelectorAll(
            ".ef-vat-calculator"
        )
        .forEach(calc=>{

            setupInputs(calc);

            setupReset(calc);

            const operation=
                calc.querySelector(
                    ".ef-vat-operation"
                );

            const amountLabel=
                calc.querySelector(
                    ".ef-vat-amount-label"
                );

            const amountInput=
                calc.querySelector(
                    ".ef-vat-amount"
                );

            /*
             * Cambiar automáticamente el nombre
             * del importe según la operación.
             */

            operation.addEventListener(
                "change",
                function(){

                    if(this.value==="add"){

                        amountLabel.textContent=
                            "Importe sin IVA (€)";

                        amountInput.placeholder=
                            "1.000";

                    }

                    if(this.value==="remove"){

                        amountLabel.textContent=
                            "Importe con IVA (€)";

                        amountInput.placeholder=
                            "1.210";

                    }

                    if(this.value==="from-vat"){

                        amountLabel.textContent=
                            "Importe de IVA (€)";

                        amountInput.placeholder=
                            "210";

                    }

                }
            );

            calc.querySelector(".ef-button")
                .addEventListener(
                    "click",
                    function(){

                        const mode=
                            operation.value;

                        const rate=
                            EF.parse(
                                calc.querySelector(
                                    ".ef-vat-rate"
                                )
                            );

                        const amount=
                            EF.parse(
                                amountInput
                            );

                        if(
                            isNaN(rate)||
                            isNaN(amount)||
                            rate<=0||
                            amount<0
                        ){

                            showError(calc);

                            return;

                        }

                        let result;

                        if(mode==="add"){

                            result=
                                EF.vatAdd(
                                    amount,
                                    rate
                                );

                        }

                        if(mode==="remove"){

                            result=
                                EF.vatRemove(
                                    amount,
                                    rate
                                );

                        }

                        if(mode==="from-vat"){

                            result=
                                EF.vatFromAmount(
                                    amount,
                                    rate
                                );

                        }

                        calc.querySelector(
                            ".ef-vat-total"
                        ).textContent=
                            EF.formatCurrency(
                                result.total
                            );

                        calc.querySelector(
                            ".ef-vat-base"
                        ).textContent=
                            EF.formatCurrency(
                                result.base
                            );

                        calc.querySelector(
                            ".ef-vat-tax"
                        ).textContent=
                            EF.formatCurrency(
                                result.vat
                            );

                        displayResults(calc);

                    }
                );

            setupSharing(calc,function(){

                return "He calculado el IVA: "+
                    "base imponible de "+
                    calc.querySelector(
                        ".ef-vat-base"
                    ).textContent+
                    ", IVA de "+
                    calc.querySelector(
                        ".ef-vat-tax"
                    ).textContent+
                    " y total de "+
                    calc.querySelector(
                        ".ef-vat-total"
                    ).textContent+".";

            });

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

    initRetirementCalculators();

    initLoanAmortizationCalculators();

    initROICalculators();

    initNetWorthCalculators();

    initMonthlySavingsCalculators();

    initInflationCalculators();

    initVATCalculators();

}


if(document.readyState==="loading"){

    document.addEventListener(
        "DOMContentLoaded",
        initEF
    );

}else{

    initEF();

}
